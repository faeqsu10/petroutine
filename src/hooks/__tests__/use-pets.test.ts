import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// vi.mock 팩토리 클로저 내에서 사용할 수 있도록 모킹 함수를 호이스팅한다.
// ---------------------------------------------------------------------------
const {
  mockAddDoc,
  mockUpdateDoc,
  mockCollection,
  mockDoc,
  mockQuery,
  mockWhere,
  mockOrderBy,
  mockGetDocs,
  mockWriteBatch,
  mockBatch,
  mockAuth,
} = vi.hoisted(() => {
  const mockAuth = { currentUser: { uid: 'test-user' } as { uid: string } | null };
  const mockBatch = {
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  return {
    mockAddDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
    mockCollection: vi.fn(),
    mockDoc: vi.fn(),
    mockQuery: vi.fn(),
    mockWhere: vi.fn(),
    mockOrderBy: vi.fn(),
    mockGetDocs: vi.fn(),
    mockWriteBatch: vi.fn(() => mockBatch),
    mockBatch,
    mockAuth,
  };
});

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
  writeBatch: mockWriteBatch,
}));

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: mockAuth,
}));

// ---------------------------------------------------------------------------
// 훅 임포트 (모킹 등록 이후)
// ---------------------------------------------------------------------------
import { useCreatePet, useUpdatePet, useDeletePet } from '../use-pets';

// ---------------------------------------------------------------------------
// 테스트 헬퍼
// ---------------------------------------------------------------------------

/** 매 호출마다 새로운 QueryClient로 renderHook을 래핑한다. */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
}

/** 최소 유효 반려동물 페이로드 (Omit<Pet, 'id'>). */
const basePet = {
  name: 'Coco',
  species: 'dog' as const,
  breed: null,
  birthDate: null,
  gender: null,
  neutered: false,
  weightKg: null,
  avatarUrl: null,
};

// ---------------------------------------------------------------------------
// useCreatePet
// ---------------------------------------------------------------------------
describe('useCreatePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = { uid: 'test-user' };
    mockAddDoc.mockResolvedValue({ id: 'new-pet-id' });
    mockCollection.mockReturnValue('pets-collection-ref');
  });

  it('userId, createdAt, updatedAt, archivedAt=null로 반려동물 문서를 생성한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet);
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const [, docData] = mockAddDoc.mock.calls[0];

    expect(docData.userId).toBe('test-user');
    expect(docData.archivedAt).toBeNull();
    expect(typeof docData.createdAt).toBe('string');
    expect(typeof docData.updatedAt).toBe('string');
    // createdAt과 updatedAt은 훅 내부에서 동일한 'now' 문자열로 설정됨
    expect(docData.createdAt).toBe(docData.updatedAt);
  });

  it('createdAt에 유효한 ISO 8601 타임스탬프를 저장한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet);
    });

    const [, docData] = mockAddDoc.mock.calls[0];
    expect(isNaN(Date.parse(docData.createdAt))).toBe(false);
  });

  it('필수 필드(name, species, neutered)를 Firestore 문서에 매핑한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    const petInput = { ...basePet, name: 'Max', species: 'cat' as const, neutered: true };

    await act(async () => {
      await result.current.mutateAsync(petInput);
    });

    const [, docData] = mockAddDoc.mock.calls[0];
    expect(docData.name).toBe('Max');
    expect(docData.species).toBe('cat');
    expect(docData.neutered).toBe(true);
  });

  it('선택 필드가 제공되지 않으면 null로 설정한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet);
    });

    const [, docData] = mockAddDoc.mock.calls[0];
    expect(docData.breed).toBeNull();
    expect(docData.birthDate).toBeNull();
    expect(docData.gender).toBeNull();
    expect(docData.weightKg).toBeNull();
    expect(docData.avatarUrl).toBeNull();
  });

  it('제공된 선택 필드 값을 올바르게 저장한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    const petWithOptionals = {
      ...basePet,
      breed: 'Poodle',
      birthDate: '2020-06-15',
      gender: 'female' as const,
      weightKg: 4.5,
      avatarUrl: 'https://example.com/avatar.png',
    };

    await act(async () => {
      await result.current.mutateAsync(petWithOptionals);
    });

    const [, docData] = mockAddDoc.mock.calls[0];
    expect(docData.breed).toBe('Poodle');
    expect(docData.birthDate).toBe('2020-06-15');
    expect(docData.gender).toBe('female');
    expect(docData.weightKg).toBe(4.5);
    expect(docData.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('Firestore가 생성한 id와 함께 반려동물을 반환한다', async () => {
    mockAddDoc.mockResolvedValue({ id: 'generated-id-123' });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    let created: unknown;
    await act(async () => {
      created = await result.current.mutateAsync(basePet);
    });

    expect((created as { id: string }).id).toBe('generated-id-123');
  });

  it('인증되지 않은 경우 Not authenticated 에러를 던진다', async () => {
    mockAuth.currentUser = null;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });

  it('성공 시 pets 쿼리 캐시를 무효화한다', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pets'] });
  });

  it('Firestore db와 "pets" 경로로 collection을 호출한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet);
    });

    expect(mockCollection).toHaveBeenCalledWith({}, 'pets');
  });
});

// ---------------------------------------------------------------------------
// useUpdatePet
// ---------------------------------------------------------------------------
describe('useUpdatePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = { uid: 'test-user' };
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('pet-doc-ref');
  });

  it('유효한 ISO updatedAt 타임스탬프로 updateDoc을 호출한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'Updated Name' });
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(typeof updateData.updatedAt).toBe('string');
    expect(isNaN(Date.parse(updateData.updatedAt))).toBe(false);
  });

  it('제공된 필드만 업데이트 payload에 포함한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'Solo Update' });
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.name).toBe('Solo Update');
    // 전달하지 않은 필드는 포함되지 않아야 함 (updatedAt은 항상 주입됨)
    expect(updateData.species).toBeUndefined();
    expect(updateData.breed).toBeUndefined();
  });

  it('Firestore 업데이트 payload에 id를 포함하지 않는다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'No Id In Payload' });
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.id).toBeUndefined();
  });

  it('올바른 pet id로 문서 참조를 생성한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-abc', name: 'Some Name' });
    });

    expect(mockDoc).toHaveBeenCalledWith({}, 'pets', 'pet-abc');
  });

  it('여러 선택 필드의 부분 업데이트를 지원한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-2', weightKg: 6.0, breed: 'Shih Tzu' });
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.weightKg).toBe(6.0);
    expect(updateData.breed).toBe('Shih Tzu');
  });

  it('인증되지 않은 경우 Not authenticated 에러를 던진다', async () => {
    mockAuth.currentUser = null;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'Should Fail' }).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });

  it('성공 시 pets 쿼리 캐시를 무효화한다', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'Cache Bust' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pets'] });
  });
});

// ---------------------------------------------------------------------------
// useDeletePet
// ---------------------------------------------------------------------------
describe('useDeletePet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = { uid: 'test-user' };
    mockDoc.mockReturnValue('pet-doc-ref');
    mockCollection.mockReturnValue('collection-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-ref');
    // careItems 없는 기본 케이스: 빈 스냅샷 반환
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockBatch.update.mockReset();
    mockBatch.commit.mockReset();
    mockBatch.commit.mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue(mockBatch);
  });

  it('archivedAt을 현재 ISO 타임스탬프로 설정하여 소프트 삭제한다', async () => {
    const beforeCall = new Date();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-to-delete');
    });

    // pet에 대한 batch.update 호출 확인
    expect(mockBatch.update).toHaveBeenCalledWith('pet-doc-ref', expect.objectContaining({
      archivedAt: expect.any(String),
      updatedAt: expect.any(String),
    }));
    const petUpdateCall = mockBatch.update.mock.calls[0];
    const updateData = petUpdateCall[1];

    expect(typeof updateData.archivedAt).toBe('string');
    const archivedDate = new Date(updateData.archivedAt);
    expect(isNaN(archivedDate.getTime())).toBe(false);
    // archivedAt은 호출 전 시점 이후여야 함
    expect(archivedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
  });

  it('삭제 시점에 유효한 ISO updatedAt 타임스탬프를 설정한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-to-delete');
    });

    const petUpdateCall = mockBatch.update.mock.calls[0];
    const updateData = petUpdateCall[1];
    expect(typeof updateData.updatedAt).toBe('string');
    expect(isNaN(Date.parse(updateData.updatedAt))).toBe(false);
  });

  it('addDoc을 호출하지 않고 writeBatch로 소프트 삭제한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-xyz');
    });

    expect(mockAddDoc).not.toHaveBeenCalled();
    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('petId로 올바른 Firestore 문서를 타겟팅한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('my-specific-pet');
    });

    expect(mockDoc).toHaveBeenCalledWith({}, 'pets', 'my-specific-pet');
  });

  it('인증되지 않은 경우 Not authenticated 에러를 던진다', async () => {
    mockAuth.currentUser = null;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-1').catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });

  it('성공 시 pets와 care-items 쿼리 캐시를 무효화한다', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-99');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pets'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['care-items'] });
  });

  it('active careItems를 isActive: false로 비활성화한다', async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          { id: 'care-item-1' },
          { id: 'care-item-2' },
        ],
      })
      // care-item-1의 schedules
      .mockResolvedValueOnce({ docs: [] })
      // care-item-2의 schedules
      .mockResolvedValueOnce({ docs: [] });

    mockDoc
      .mockReturnValueOnce('pet-doc-ref')
      .mockReturnValueOnce('care-item-1-ref')
      .mockReturnValueOnce('care-item-2-ref');

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-with-care');
    });

    // pet + 2 careItems = 3 batch.update calls
    expect(mockBatch.update).toHaveBeenCalledTimes(3);
    expect(mockBatch.update).toHaveBeenCalledWith('care-item-1-ref', expect.objectContaining({
      isActive: false,
    }));
    expect(mockBatch.update).toHaveBeenCalledWith('care-item-2-ref', expect.objectContaining({
      isActive: false,
    }));
  });

  it('active careSchedules를 cancelled로 변경한다', async () => {
    mockGetDocs
      // careItems 조회
      .mockResolvedValueOnce({ docs: [{ id: 'care-item-1' }] })
      // care-item-1의 schedules
      .mockResolvedValueOnce({ docs: [{ id: 'sched-1' }, { id: 'sched-2' }] });

    mockDoc
      .mockReturnValueOnce('pet-doc-ref')
      .mockReturnValueOnce('care-item-1-ref')
      .mockReturnValueOnce('sched-1-ref')
      .mockReturnValueOnce('sched-2-ref');

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-with-schedules');
    });

    // pet + 1 careItem + 2 schedules = 4 batch.update calls
    expect(mockBatch.update).toHaveBeenCalledTimes(4);
    expect(mockBatch.update).toHaveBeenCalledWith('sched-1-ref', expect.objectContaining({
      status: 'cancelled',
    }));
    expect(mockBatch.update).toHaveBeenCalledWith('sched-2-ref', expect.objectContaining({
      status: 'cancelled',
    }));
  });
});

// ---------------------------------------------------------------------------
// 엣지 케이스: useCreatePet
// ---------------------------------------------------------------------------
describe('useCreatePet — 엣지 케이스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = { uid: 'test-user' };
    mockAddDoc.mockResolvedValue({ id: 'new-pet-id' });
    mockCollection.mockReturnValue('pets-collection-ref');
  });

  it('Firestore addDoc 실패 시 에러를 전파한다', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore write failed'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect((result.current.error as Error).message).toBe('Firestore write failed');
  });

  it('한국어 이름을 올바르게 저장한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ...basePet, name: '멍멍이🐶' });
    });

    const [, docData] = mockAddDoc.mock.calls[0];
    expect(docData.name).toBe('멍멍이🐶');
  });

  it('weightKg에 소수점 값을 저장할 수 있다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ...basePet, weightKg: 3.75 });
    });

    const [, docData] = mockAddDoc.mock.calls[0];
    expect(docData.weightKg).toBe(3.75);
  });
});

// ---------------------------------------------------------------------------
// 엣지 케이스: useUpdatePet
// ---------------------------------------------------------------------------
describe('useUpdatePet — 엣지 케이스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = { uid: 'test-user' };
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('pet-doc-ref');
  });

  it('Firestore updateDoc 실패 시 에러를 전파한다', async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error('Permission denied'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'test' }).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect((result.current.error as Error).message).toBe('Permission denied');
  });

  it('모든 필드를 동시에 업데이트할 수 있다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'pet-1',
        name: '새이름',
        species: 'cat',
        breed: 'Persian',
        birthDate: '2020-01-01',
        gender: 'male',
        neutered: true,
        weightKg: 5.5,
      });
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.name).toBe('새이름');
    expect(updateData.species).toBe('cat');
    expect(updateData.breed).toBe('Persian');
    expect(updateData.birthDate).toBe('2020-01-01');
    expect(updateData.gender).toBe('male');
    expect(updateData.neutered).toBe(true);
    expect(updateData.weightKg).toBe(5.5);
    expect(updateData.id).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 엣지 케이스: useDeletePet
// ---------------------------------------------------------------------------
describe('useDeletePet — 엣지 케이스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = { uid: 'test-user' };
    mockDoc.mockReturnValue('pet-doc-ref');
    mockCollection.mockReturnValue('collection-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-ref');
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockBatch.update.mockReset();
    mockBatch.commit.mockReset();
    mockBatch.commit.mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue(mockBatch);
  });

  it('batch.commit 실패 시 에러를 전파한다', async () => {
    mockBatch.commit.mockRejectedValueOnce(new Error('Network timeout'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-1').catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect((result.current.error as Error).message).toBe('Network timeout');
  });

  it('archivedAt과 updatedAt이 동일한 시점에 설정된다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-1');
    });

    const petUpdateCall = mockBatch.update.mock.calls[0];
    const updateData = petUpdateCall[1];
    // 두 타임스탬프는 같은 'now' 변수로 설정되므로 동일해야 함
    expect(updateData.archivedAt).toBe(updateData.updatedAt);
  });

  it('연결된 케어 항목이 없어도 삭제가 성공한다', async () => {
    // getDocs가 빈 스냅샷 반환 (beforeEach에서 이미 설정됨)
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-no-care-items');
    });

    // pet soft delete 1회만 실행되고 commit 성공
    expect(mockBatch.update).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).toHaveBeenCalledWith(
      'pet-doc-ref',
      expect.objectContaining({ archivedAt: expect.any(String) }),
    );
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('삭제 성공 시 care-items 쿼리도 invalidate된다', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-cascade-test');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['care-items'] });
  });
});
