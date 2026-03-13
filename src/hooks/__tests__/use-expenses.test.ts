import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ============================================================
// Firebase SDK 모킹
// ============================================================
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user' },
  },
}));

// ============================================================
// 모킹된 모듈 임포트 (vi.mock 이후에 임포트해야 함)
// ============================================================
import { addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase/client';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/use-expenses';

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
// useCreateExpense
// ============================================================
describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (addDoc as Mock).mockResolvedValue({ id: 'new-expense-id' });
  });

  it('모든 필드로 지출 문서를 생성한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 15000,
      description: '사료 구매',
      expenseDate: '2026-03-13',
      memo: '사료 메모',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addDoc).toHaveBeenCalledTimes(1);
    const calledWith = (addDoc as Mock).mock.calls[0][1];
    expect(calledWith.userId).toBe('test-user');
    expect(calledWith.petId).toBe('pet-1');
    expect(calledWith.categoryId).toBe('cat-1');
    expect(calledWith.amount).toBe(15000);
    expect(calledWith.description).toBe('사료 구매');
    expect(calledWith.expenseDate).toBe('2026-03-13');
    expect(calledWith.memo).toBe('사료 메모');
  });

  it('receiptUrl을 null로 설정한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 5000,
      description: '간식',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledWith = (addDoc as Mock).mock.calls[0][1];
    expect(calledWith.receiptUrl).toBeNull();
  });

  it('memo가 없을 때 null로 저장한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 5000,
      description: '간식',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledWith = (addDoc as Mock).mock.calls[0][1];
    expect(calledWith.memo).toBeNull();
  });

  it('생성된 지출을 id와 함께 반환한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    const expenseInput = {
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 15000,
      description: '사료',
      expenseDate: '2026-03-13',
      memo: null,
    };

    result.current.mutate(expenseInput);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: 'new-expense-id',
      ...expenseInput,
    });
  });

  it('인증되지 않은 경우 에러를 던진다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 5000,
      description: '간식',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });

  it('createdAt과 updatedAt 타임스탬프를 자동 설정한다', async () => {
    const before = new Date().toISOString();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 5000,
      description: '간식',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const after = new Date().toISOString();
    const calledWith = (addDoc as Mock).mock.calls[0][1];

    expect(calledWith.createdAt).toBeDefined();
    expect(calledWith.updatedAt).toBeDefined();
    expect(calledWith.createdAt >= before).toBe(true);
    expect(calledWith.createdAt <= after).toBe(true);
    expect(calledWith.createdAt).toBe(calledWith.updatedAt);
  });
});

// ============================================================
// useUpdateExpense
// ============================================================
describe('useUpdateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (updateDoc as Mock).mockResolvedValue(undefined);
    (doc as Mock).mockReturnValue('mock-expense-doc-ref');
  });

  it('지출 필드를 updatedAt 타임스탬프와 함께 업데이트한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    const before = new Date().toISOString();

    result.current.mutate({
      id: 'expense-1',
      amount: 20000,
      description: '수정된 사료',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const after = new Date().toISOString();

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const calledWith = (updateDoc as Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(calledWith.amount).toBe(20000);
    expect(calledWith.description).toBe('수정된 사료');
    expect(calledWith.updatedAt >= before).toBe(true);
    expect(calledWith.updatedAt <= after).toBe(true);
  });

  it('올바른 문서 참조로 doc()을 호출한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({ id: 'expense-42', amount: 3000 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(doc).toHaveBeenCalledWith({}, 'expenses', 'expense-42');
  });

  it('업데이트 payload에 id 필드를 포함하지 않는다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({ id: 'expense-1', amount: 9000 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledWith = (updateDoc as Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(calledWith).not.toHaveProperty('id');
  });

  it('인증되지 않은 경우 에러를 던진다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({ id: 'expense-1', amount: 5000 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });
});

// ============================================================
// useDeleteExpense
// ============================================================
describe('useDeleteExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (deleteDoc as Mock).mockResolvedValue(undefined);
    (doc as Mock).mockReturnValue('mock-expense-doc-ref');
  });

  it('deleteDoc으로 지출 문서를 하드 삭제한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(deleteDoc).toHaveBeenCalledWith('mock-expense-doc-ref');
  });

  it('올바른 문서 참조로 doc()을 호출한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-99');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(doc).toHaveBeenCalledWith({}, 'expenses', 'expense-99');
  });

  it('인증되지 않은 경우 에러를 던진다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });

  it('updateDoc이 아닌 deleteDoc만 호출한다 (소프트 삭제 아님)', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateDoc).not.toHaveBeenCalled();
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });

  it('Firestore deleteDoc 실패 시 에러를 전파한다', async () => {
    (deleteDoc as Mock).mockRejectedValueOnce(new Error('Firestore delete failed'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Firestore delete failed');
  });
});

// ============================================================
// Edge cases: useCreateExpense
// ============================================================
describe('useCreateExpense — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (addDoc as Mock).mockResolvedValue({ id: 'new-expense-id' });
  });

  it('금액이 0인 지출을 생성할 수 있다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 0,
      description: '무료 샘플',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledWith = (addDoc as Mock).mock.calls[0][1];
    expect(calledWith.amount).toBe(0);
  });

  it('매우 큰 금액도 정상적으로 저장한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 99999999,
      description: '고가 수술',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledWith = (addDoc as Mock).mock.calls[0][1];
    expect(calledWith.amount).toBe(99999999);
  });

  it('Firestore addDoc 실패 시 에러를 전파한다', async () => {
    (addDoc as Mock).mockRejectedValueOnce(new Error('Quota exceeded'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 5000,
      description: '간식',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Quota exceeded');
  });

  it('빈 문자열 description도 저장한다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      petId: 'pet-1',
      categoryId: 'cat-1',
      amount: 1000,
      description: '',
      expenseDate: '2026-03-13',
      memo: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledWith = (addDoc as Mock).mock.calls[0][1];
    expect(calledWith.description).toBe('');
  });
});

// ============================================================
// Edge cases: useUpdateExpense
// ============================================================
describe('useUpdateExpense — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
    (updateDoc as Mock).mockResolvedValue(undefined);
    (doc as Mock).mockReturnValue('mock-expense-doc-ref');
  });

  it('Firestore updateDoc 실패 시 에러를 전파한다', async () => {
    (updateDoc as Mock).mockRejectedValueOnce(new Error('Permission denied'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({ id: 'expense-1', amount: 5000 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Permission denied');
  });

  it('모든 필드를 동시에 업데이트할 수 있다', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      id: 'expense-1',
      amount: 25000,
      description: '수정됨',
      categoryId: 'cat-2',
      expenseDate: '2026-04-01',
      memo: '수정 메모',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledWith = (updateDoc as Mock).mock.calls[0][1] as Record<string, unknown>;
    expect(calledWith.amount).toBe(25000);
    expect(calledWith.description).toBe('수정됨');
    expect(calledWith.categoryId).toBe('cat-2');
    expect(calledWith.expenseDate).toBe('2026-04-01');
    expect(calledWith.memo).toBe('수정 메모');
    expect(calledWith.updatedAt).toBeDefined();
    expect(calledWith.id).toBeUndefined();
  });
});
