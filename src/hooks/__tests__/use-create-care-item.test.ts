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
  toLocalDateStr: (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
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
import { collection, doc, writeBatch } from 'firebase/firestore';
import { auth } from '@/lib/firebase/client';
import { calculateNextDueDate } from '@/lib/utils';
import { useCreateCareItem } from '@/hooks/use-create-care-item';

// ============================================================
// 헬퍼: QueryClient 래퍼 생성
// ============================================================
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

// ============================================================
// 기본 입력값
// ============================================================
const baseInput = {
  petId: 'pet-1',
  category: 'hygiene' as const,
  name: '목욕',
  cycleValue: 7,
  cycleUnit: 'day' as const,
  icon: '🛁',
  color: '#4A90E2',
  notifyEnabled: true,
};

// ============================================================
// useCreateCareItem
// ============================================================
describe('useCreateCareItem', () => {
  let mockBatch: { set: Mock; update: Mock; commit: Mock };
  let mockItemRef: { id: string };
  let mockScheduleRef: { id: string };

  beforeEach(() => {
    vi.clearAllMocks();

    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };

    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    (writeBatch as Mock).mockReturnValue(mockBatch);

    // doc()을 순서대로 다른 ref를 반환하도록 설정
    mockItemRef = { id: 'new-care-item-id' };
    mockScheduleRef = { id: 'new-schedule-id' };
    (doc as Mock)
      .mockReturnValueOnce(mockItemRef)
      .mockReturnValueOnce(mockScheduleRef);

    (collection as Mock).mockReturnValue('mock-collection-ref');

    // calculateNextDueDate 기본 반환값
    const nextDate = new Date('2026-03-21T00:00:00.000Z');
    (calculateNextDueDate as Mock).mockReturnValue(nextDate);
  });

  it('인증된 사용자가 케어 항목을 생성할 수 있다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync(baseInput);

    expect(mockBatch.set).toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('careItem과 careSchedule을 batch write로 생성한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync(baseInput);

    // batch.set이 두 번 호출 (careItem + careSchedule)
    expect(mockBatch.set).toHaveBeenCalledTimes(2);
    // 모든 작업이 하나의 commit으로 처리됨
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('필수 필드(petId, name, category)가 올바르게 저장된다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync(baseInput);

    expect(mockBatch.set).toHaveBeenCalledWith(
      mockItemRef,
      expect.objectContaining({
        petId: 'pet-1',
        name: '목욕',
        category: 'hygiene',
        userId: 'test-user',
      }),
    );
  });

  it('cycleValue와 cycleUnit이 올바르게 저장된다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync({ ...baseInput, cycleValue: 14, cycleUnit: 'day' });

    expect(mockBatch.set).toHaveBeenCalledWith(
      mockItemRef,
      expect.objectContaining({
        cycleValue: 14,
        cycleUnit: 'day',
      }),
    );
  });

  it('nextDueDate가 현재 날짜 + cycle로 계산된다', async () => {
    const nextDate = new Date('2026-03-21T00:00:00.000Z');
    (calculateNextDueDate as Mock).mockReturnValue(nextDate);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync(baseInput);

    // calculateNextDueDate가 현재 날짜와 cycle 인수로 호출되었는지 확인
    expect(calculateNextDueDate).toHaveBeenCalledWith(
      expect.any(Date),
      baseInput.cycleValue,
      baseInput.cycleUnit,
    );

    // 계산된 nextDueDate로 스케줄이 생성되었는지 확인
    expect(mockBatch.set).toHaveBeenCalledWith(
      mockScheduleRef,
      expect.objectContaining({
        nextDueDate: '2026-03-21',
        status: 'pending',
      }),
    );
  });

  it('인증되지 않은 경우 에러를 던진다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await expect(result.current.mutateAsync(baseInput)).rejects.toThrow('Not authenticated');
  });

  it('Firestore batch 실패 시 에러를 전파한다', async () => {
    mockBatch.commit.mockRejectedValueOnce(new Error('Firestore batch error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    result.current.mutate(baseInput);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Firestore batch error');
  });

  it('성공 시 careItems 쿼리를 invalidate한다', async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync(baseInput);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['care-items'] });
  });

  it('careItem에 isActive: true와 타임스탬프가 설정된다', async () => {
    const before = new Date().toISOString();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync(baseInput);

    const after = new Date().toISOString();

    expect(mockBatch.set).toHaveBeenCalledWith(
      mockItemRef,
      expect.objectContaining({
        isActive: true,
      }),
    );

    const itemCallArgs = mockBatch.set.mock.calls[0][1] as Record<string, unknown>;
    expect(typeof itemCallArgs.createdAt).toBe('string');
    expect(itemCallArgs.createdAt >= before).toBe(true);
    expect(itemCallArgs.createdAt <= after).toBe(true);
    expect(itemCallArgs.createdAt).toBe(itemCallArgs.updatedAt);
  });

  it('careSchedule에 careItemId와 userId가 올바르게 저장된다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync(baseInput);

    expect(mockBatch.set).toHaveBeenCalledWith(
      mockScheduleRef,
      expect.objectContaining({
        careItemId: mockItemRef.id,
        userId: 'test-user',
      }),
    );
  });
});

// ============================================================
// useCreateCareItem — 엣지 케이스
// ============================================================
describe('useCreateCareItem — 엣지 케이스', () => {
  let mockBatch: { set: Mock; update: Mock; commit: Mock };
  let mockItemRef: { id: string };
  let mockScheduleRef: { id: string };

  beforeEach(() => {
    vi.clearAllMocks();

    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };

    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    (writeBatch as Mock).mockReturnValue(mockBatch);

    mockItemRef = { id: 'new-care-item-id' };
    mockScheduleRef = { id: 'new-schedule-id' };
    (doc as Mock)
      .mockReturnValueOnce(mockItemRef)
      .mockReturnValueOnce(mockScheduleRef);

    (collection as Mock).mockReturnValue('mock-collection-ref');

    const nextDate = new Date('2026-04-14T00:00:00.000Z');
    (calculateNextDueDate as Mock).mockReturnValue(nextDate);
  });

  it('cycleUnit이 month일 때 calculateNextDueDate에 올바른 인수를 전달한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync({ ...baseInput, cycleValue: 1, cycleUnit: 'month' });

    expect(calculateNextDueDate).toHaveBeenCalledWith(expect.any(Date), 1, 'month');
  });

  it('cycleUnit이 week일 때 calculateNextDueDate에 올바른 인수를 전달한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync({ ...baseInput, cycleValue: 2, cycleUnit: 'week' });

    expect(calculateNextDueDate).toHaveBeenCalledWith(expect.any(Date), 2, 'week');
  });

  it('category가 custom일 때도 올바르게 저장된다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync({ ...baseInput, category: 'custom' });

    expect(mockBatch.set).toHaveBeenCalledWith(
      mockItemRef,
      expect.objectContaining({ category: 'custom' }),
    );
  });

  it('notifyEnabled가 false일 때도 올바르게 저장된다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    await result.current.mutateAsync({ ...baseInput, notifyEnabled: false });

    expect(mockBatch.set).toHaveBeenCalledWith(
      mockItemRef,
      expect.objectContaining({ notifyEnabled: false }),
    );
  });

  it('성공 시 생성된 아이템의 id를 반환한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCareItem(), { wrapper });

    const created = await result.current.mutateAsync(baseInput);

    expect(created).toEqual({ id: mockItemRef.id });
  });
});
