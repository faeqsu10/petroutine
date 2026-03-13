import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoist mock functions so they are available inside vi.mock factory closures.
// vi.mock calls are hoisted to the top of the compiled output; any variables
// referenced inside the factory must be created with vi.hoisted().
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
  mockAuth,
} = vi.hoisted(() => {
  const mockAuth = { currentUser: { uid: 'test-user' } as { uid: string } | null };
  return {
    mockAddDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
    mockCollection: vi.fn(),
    mockDoc: vi.fn(),
    mockQuery: vi.fn(),
    mockWhere: vi.fn(),
    mockOrderBy: vi.fn(),
    mockGetDocs: vi.fn(),
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
}));

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: mockAuth,
}));

// ---------------------------------------------------------------------------
// Hook imports (after mocks are registered)
// ---------------------------------------------------------------------------
import { useCreatePet, useUpdatePet, useDeletePet } from '../use-pets';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Wraps a renderHook with a fresh QueryClient on every call. */
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

/** Minimal valid pet payload (Omit<Pet, 'id'>). */
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

  it('creates a pet doc with userId, createdAt, updatedAt, and archivedAt=null', async () => {
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
    // createdAt and updatedAt are set to the same 'now' string inside the hook
    expect(docData.createdAt).toBe(docData.updatedAt);
  });

  it('stores a valid ISO 8601 timestamp for createdAt', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet);
    });

    const [, docData] = mockAddDoc.mock.calls[0];
    expect(isNaN(Date.parse(docData.createdAt))).toBe(false);
  });

  it('maps required pet fields (name, species, neutered) to the Firestore document', async () => {
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

  it('sets optional fields to null when not provided', async () => {
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

  it('stores provided optional field values when supplied', async () => {
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

  it('returns the created pet with the Firestore-generated id', async () => {
    mockAddDoc.mockResolvedValue({ id: 'generated-id-123' });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePet(), { wrapper });

    let created: unknown;
    await act(async () => {
      created = await result.current.mutateAsync(basePet);
    });

    expect((created as { id: string }).id).toBe('generated-id-123');
  });

  it('throws "Not authenticated" when there is no current user', async () => {
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

  it('invalidates the pets query cache on success', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(basePet);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pets'] });
  });

  it('calls collection with the Firestore db and "pets" path', async () => {
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

  it('calls updateDoc with a valid ISO updatedAt timestamp', async () => {
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

  it('sends only the provided fields in the update payload', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'Solo Update' });
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.name).toBe('Solo Update');
    // Fields not passed should not be present (besides updatedAt which is always injected)
    expect(updateData.species).toBeUndefined();
    expect(updateData.breed).toBeUndefined();
  });

  it('does not include id in the Firestore update payload', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-1', name: 'No Id In Payload' });
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.id).toBeUndefined();
  });

  it('calls doc with the correct pet id to build the document reference', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-abc', name: 'Some Name' });
    });

    expect(mockDoc).toHaveBeenCalledWith({}, 'pets', 'pet-abc');
  });

  it('supports partial updates with multiple optional fields', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdatePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'pet-2', weightKg: 6.0, breed: 'Shih Tzu' });
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(updateData.weightKg).toBe(6.0);
    expect(updateData.breed).toBe('Shih Tzu');
  });

  it('throws "Not authenticated" when there is no current user', async () => {
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

  it('invalidates the pets query cache on success', async () => {
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
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('pet-doc-ref');
  });

  it('soft-deletes by setting archivedAt to a current ISO timestamp', async () => {
    const beforeCall = new Date();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-to-delete');
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updateData] = mockUpdateDoc.mock.calls[0];

    expect(typeof updateData.archivedAt).toBe('string');
    const archivedDate = new Date(updateData.archivedAt);
    expect(isNaN(archivedDate.getTime())).toBe(false);
    // archivedAt must be at or after the moment before the call
    expect(archivedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
  });

  it('sets updatedAt to a valid ISO timestamp at the time of deletion', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-to-delete');
    });

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    expect(typeof updateData.updatedAt).toBe('string');
    expect(isNaN(Date.parse(updateData.updatedAt))).toBe(false);
  });

  it('does not call addDoc — only calls updateDoc for the soft delete', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-xyz');
    });

    expect(mockAddDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it('targets the correct Firestore document by petId', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('my-specific-pet');
    });

    expect(mockDoc).toHaveBeenCalledWith({}, 'pets', 'my-specific-pet');
  });

  it('throws "Not authenticated" when there is no current user', async () => {
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

  it('invalidates the pets query cache on success', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeletePet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pet-99');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pets'] });
  });
});

// ---------------------------------------------------------------------------
// Edge cases: useCreatePet
// ---------------------------------------------------------------------------
describe('useCreatePet — edge cases', () => {
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
// Edge cases: useUpdatePet
// ---------------------------------------------------------------------------
describe('useUpdatePet — edge cases', () => {
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
// Edge cases: useDeletePet
// ---------------------------------------------------------------------------
describe('useDeletePet — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = { uid: 'test-user' };
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('pet-doc-ref');
  });

  it('Firestore updateDoc 실패 시 에러를 전파한다', async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error('Network timeout'));

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

    const [, updateData] = mockUpdateDoc.mock.calls[0];
    // 두 타임스탬프는 각각 new Date().toISOString()으로 생성되므로
    // 같은 밀리초 내에 있어야 함
    const archived = new Date(updateData.archivedAt).getTime();
    const updated = new Date(updateData.updatedAt).getTime();
    expect(Math.abs(archived - updated)).toBeLessThanOrEqual(1);
  });
});
