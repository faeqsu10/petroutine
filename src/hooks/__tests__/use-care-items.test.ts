import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ============================================================
// Firebase SDK 모킹
// ============================================================
vi.mock('firebase/firestore', () => {
  const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  return {
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    writeBatch: vi.fn(() => mockBatch),
  };
});

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user' },
  },
}));

vi.mock('@/lib/utils', () => ({
  calculateNextDueDate: vi.fn(),
  getScheduleUrgency: vi.fn(),
  getUrgencyColor: vi.fn(),
  formatDate: vi.fn(),
  getDdayText: vi.fn(),
  formatCurrency: vi.fn(),
  cn: vi.fn(),
}));

// ============================================================
// 모킹된 모듈 임포트 (vi.mock 이후에 임포트해야 함)
// ============================================================
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth } from '@/lib/firebase/client';
import { calculateNextDueDate } from '@/lib/utils';
import { useCompleteCare, useUpdateCareItem, useDeleteCareItem } from '@/hooks/use-care-items';

// ============================================================
// 헬퍼: QueryClient 래퍼 생성
// ============================================================
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ============================================================
// useCompleteCare
// ============================================================
describe('useCompleteCare', () => {
  let mockBatch: { set: Mock; update: Mock; commit: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    // auth 초기 상태: 인증됨
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };

    // writeBatch가 반환할 batch 객체 설정
    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    (writeBatch as Mock).mockReturnValue(mockBatch);

    // collection, doc 기본 모킹
    (collection as Mock).mockReturnValue('mock-collection-ref');
    (doc as Mock).mockReturnValue('mock-doc-ref');

    // calculateNextDueDate 기본 반환값
    const nextDate = new Date('2026-04-13T00:00:00.000Z');
    (calculateNextDueDate as Mock).mockReturnValue(nextDate);
  });

  it('care log를 올바른 데이터로 생성한다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 7,
      cycleUnit: 'day',
    });

    // batch.set이 care log 데이터로 호출되었는지 확인
    expect(mockBatch.set).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        careItemId: 'care-item-1',
        userId: 'test-user',
        scheduledDate: null,
        memo: null,
      }),
    );
  });

  it('현재 스케줄 상태를 completed로 업데이트한다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 7,
      cycleUnit: 'day',
    });

    expect(mockBatch.update).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        status: 'completed',
      }),
    );
  });

  it('calculateNextDueDate로 계산된 날짜로 다음 스케줄을 생성한다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 7,
      cycleUnit: 'day',
    });

    // calculateNextDueDate가 올바른 인수로 호출되었는지 확인
    expect(calculateNextDueDate).toHaveBeenCalledWith(
      expect.any(Date),
      7,
      'day',
    );

    // 다음 스케줄이 pending 상태로 생성되었는지 확인
    expect(mockBatch.set).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        careItemId: 'care-item-1',
        status: 'pending',
        nextDueDate: '2026-04-13',
      }),
    );
  });

  it('memo가 제공되면 care log에 memo를 포함한다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 1,
      cycleUnit: 'month',
      memo: '오늘 목욕 완료',
    });

    expect(mockBatch.set).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        memo: '오늘 목욕 완료',
      }),
    );
  });

  it('memo가 없으면 care log의 memo를 null로 설정한다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 1,
      cycleUnit: 'week',
      // memo 미제공
    });

    expect(mockBatch.set).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        memo: null,
      }),
    );
  });

  it('인증되지 않은 경우 Not authenticated 에러를 던진다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await expect(
      result.current.mutateAsync({
        careItemId: 'care-item-1',
        scheduleId: 'schedule-1',
        cycleValue: 7,
        cycleUnit: 'day',
      }),
    ).rejects.toThrow('Not authenticated');
  });

  it('세 가지 작업(log 생성, 스케줄 완료, 다음 스케줄 생성)이 단일 batch로 처리된다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 7,
      cycleUnit: 'day',
    });

    // batch.set이 두 번 호출 (care log + next schedule)
    expect(mockBatch.set).toHaveBeenCalledTimes(2);
    // batch.update가 한 번 호출 (current schedule 완료)
    expect(mockBatch.update).toHaveBeenCalledTimes(1);
    // 모든 작업이 하나의 commit으로 처리됨
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });
});

// ============================================================
// useUpdateCareItem
// ============================================================
describe('useUpdateCareItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (doc as Mock).mockReturnValue('mock-doc-ref');
    (updateDoc as Mock).mockResolvedValue(undefined);
  });

  it('care item 필드와 updatedAt 타임스탬프를 업데이트한다', async () => {
    const { result } = renderHook(() => useUpdateCareItem(), { wrapper: makeWrapper() });

    const before = new Date().toISOString();

    await result.current.mutateAsync({
      id: 'care-item-1',
      name: '새로운 이름',
      cycleValue: 14,
      cycleUnit: 'day',
      icon: '🐾',
      color: '#FF5733',
    });

    const after = new Date().toISOString();

    expect(updateDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        name: '새로운 이름',
        cycleValue: 14,
        cycleUnit: 'day',
        icon: '🐾',
        color: '#FF5733',
      }),
    );

    // updatedAt이 호출 시점의 ISO 문자열인지 확인
    const callArgs = (updateDoc as Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(typeof callArgs.updatedAt).toBe('string');
    expect(callArgs.updatedAt >= before).toBe(true);
    expect(callArgs.updatedAt <= after).toBe(true);
  });

  it('인증되지 않은 경우 Not authenticated 에러를 던진다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const { result } = renderHook(() => useUpdateCareItem(), { wrapper: makeWrapper() });

    await expect(
      result.current.mutateAsync({
        id: 'care-item-1',
        name: '변경',
      }),
    ).rejects.toThrow('Not authenticated');
  });

  it('부분 필드만 업데이트할 수 있다', async () => {
    const { result } = renderHook(() => useUpdateCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      id: 'care-item-1',
      name: '이름만 변경',
    });

    expect(updateDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        name: '이름만 변경',
      }),
    );

    const callArgs = (updateDoc as Mock).mock.calls[0][1] as Record<string, unknown>;
    // id는 업데이트 데이터에 포함되지 않아야 함
    expect(callArgs.id).toBeUndefined();
  });

  it('올바른 컬렉션 경로로 doc을 참조한다', async () => {
    const { result } = renderHook(() => useUpdateCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      id: 'care-item-42',
      color: '#000000',
    });

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'careItems', 'care-item-42');
  });
});

// ============================================================
// useDeleteCareItem
// ============================================================
describe('useDeleteCareItem', () => {
  let mockBatch: { set: Mock; update: Mock; commit: Mock };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (doc as Mock).mockReturnValue('mock-doc-ref');

    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    (writeBatch as Mock).mockReturnValue(mockBatch);
    (collection as Mock).mockReturnValue('mock-collection-ref');
    (query as Mock).mockReturnValue('mock-query-ref');
    (where as Mock).mockReturnValue('mock-where-ref');

    // 기본: 열린 스케줄 없음
    (getDocs as Mock).mockResolvedValue({ docs: [] });
  });

  it('batch로 isActive를 false로 설정하여 소프트 삭제한다', async () => {
    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync('care-item-1');

    expect(mockBatch.update).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        isActive: false,
      }),
    );
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('소프트 삭제 시 updatedAt 타임스탬프를 설정한다', async () => {
    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    const before = new Date().toISOString();
    await result.current.mutateAsync('care-item-1');
    const after = new Date().toISOString();

    const callArgs = mockBatch.update.mock.calls[0][1] as Record<string, unknown>;
    expect(typeof callArgs.updatedAt).toBe('string');
    expect(callArgs.updatedAt >= before).toBe(true);
    expect(callArgs.updatedAt <= after).toBe(true);
  });

  it('관련 pending/due/overdue 스케줄을 cancelled로 변경한다', async () => {
    const mockScheduleDocs = [
      { ref: 'schedule-ref-1' },
      { ref: 'schedule-ref-2' },
    ];
    (getDocs as Mock).mockResolvedValue({ docs: mockScheduleDocs });

    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync('care-item-1');

    // care item soft delete + 2 schedule cancellations = 3 batch.update calls
    expect(mockBatch.update).toHaveBeenCalledTimes(3);

    // 스케줄 취소 확인
    expect(mockBatch.update).toHaveBeenCalledWith(
      'schedule-ref-1',
      expect.objectContaining({ status: 'cancelled' }),
    );
    expect(mockBatch.update).toHaveBeenCalledWith(
      'schedule-ref-2',
      expect.objectContaining({ status: 'cancelled' }),
    );
  });

  it('열린 스케줄이 없으면 care item만 업데이트한다', async () => {
    (getDocs as Mock).mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync('care-item-1');

    // care item soft delete만 = 1 batch.update call
    expect(mockBatch.update).toHaveBeenCalledTimes(1);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('인증되지 않은 경우 Not authenticated 에러를 던진다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync('care-item-1')).rejects.toThrow(
      'Not authenticated',
    );
  });

  it('모든 작업이 단일 batch로 원자적 처리된다', async () => {
    const mockScheduleDocs = [{ ref: 'schedule-ref-1' }];
    (getDocs as Mock).mockResolvedValue({ docs: mockScheduleDocs });

    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync('care-item-1');

    expect(writeBatch).toHaveBeenCalledTimes(1);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('batch.commit 실패 시 에러를 전파한다', async () => {
    mockBatch.commit.mockRejectedValueOnce(new Error('Firestore batch error'));

    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    await expect(result.current.mutateAsync('care-item-1')).rejects.toThrow(
      'Firestore batch error',
    );
  });

  it('다수의 열린 스케줄(10개)도 모두 취소한다', async () => {
    const manyDocs = Array.from({ length: 10 }, (_, i) => ({ ref: `schedule-ref-${i}` }));
    (getDocs as Mock).mockResolvedValue({ docs: manyDocs });

    const { result } = renderHook(() => useDeleteCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync('care-item-1');

    // 1 (care item soft delete) + 10 (schedule cancellations)
    expect(mockBatch.update).toHaveBeenCalledTimes(11);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });
});

// ============================================================
// useCompleteCare — 엣지 케이스
// ============================================================
describe('useCompleteCare — edge cases', () => {
  let mockBatch: { set: Mock; update: Mock; commit: Mock };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };

    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    (writeBatch as Mock).mockReturnValue(mockBatch);
    (collection as Mock).mockReturnValue('mock-collection-ref');
    (doc as Mock).mockReturnValue('mock-doc-ref');

    const nextDate = new Date('2026-04-13T00:00:00.000Z');
    (calculateNextDueDate as Mock).mockReturnValue(nextDate);
  });

  it('batch.commit 실패 시 에러를 전파한다', async () => {
    mockBatch.commit.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await expect(
      result.current.mutateAsync({
        careItemId: 'care-item-1',
        scheduleId: 'schedule-1',
        cycleValue: 7,
        cycleUnit: 'day',
      }),
    ).rejects.toThrow('Network error');
  });

  it('cycleUnit이 month일 때 calculateNextDueDate에 올바른 인수를 전달한다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 3,
      cycleUnit: 'month',
    });

    expect(calculateNextDueDate).toHaveBeenCalledWith(
      expect.any(Date),
      3,
      'month',
    );
  });

  it('cycleUnit이 week일 때 calculateNextDueDate에 올바른 인수를 전달한다', async () => {
    const { result } = renderHook(() => useCompleteCare(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      careItemId: 'care-item-1',
      scheduleId: 'schedule-1',
      cycleValue: 2,
      cycleUnit: 'week',
    });

    expect(calculateNextDueDate).toHaveBeenCalledWith(
      expect.any(Date),
      2,
      'week',
    );
  });
});

// ============================================================
// useUpdateCareItem — 엣지 케이스
// ============================================================
describe('useUpdateCareItem — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (doc as Mock).mockReturnValue('mock-doc-ref');
    (updateDoc as Mock).mockResolvedValue(undefined);
  });

  it('Firestore updateDoc 실패 시 에러를 전파한다', async () => {
    (updateDoc as Mock).mockRejectedValueOnce(new Error('Permission denied'));

    const { result } = renderHook(() => useUpdateCareItem(), { wrapper: makeWrapper() });

    await expect(
      result.current.mutateAsync({ id: 'care-item-1', name: 'test' }),
    ).rejects.toThrow('Permission denied');
  });

  it('notifyEnabled 필드를 업데이트할 수 있다', async () => {
    const { result } = renderHook(() => useUpdateCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      id: 'care-item-1',
      notifyEnabled: false,
    });

    expect(updateDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({ notifyEnabled: false }),
    );
  });

  it('모든 필드를 동시에 업데이트할 수 있다', async () => {
    const { result } = renderHook(() => useUpdateCareItem(), { wrapper: makeWrapper() });

    await result.current.mutateAsync({
      id: 'care-item-1',
      name: '새 이름',
      cycleValue: 14,
      cycleUnit: 'week',
      icon: '🐕',
      color: '#000000',
      notifyEnabled: true,
    });

    const callArgs = (updateDoc as Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.name).toBe('새 이름');
    expect(callArgs.cycleValue).toBe(14);
    expect(callArgs.cycleUnit).toBe('week');
    expect(callArgs.icon).toBe('🐕');
    expect(callArgs.color).toBe('#000000');
    expect(callArgs.notifyEnabled).toBe(true);
    expect(callArgs.updatedAt).toBeDefined();
  });
});
