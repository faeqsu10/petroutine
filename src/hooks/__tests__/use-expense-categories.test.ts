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
  getDocs: vi.fn(),
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
import { getDocs } from 'firebase/firestore';
import { auth } from '@/lib/firebase/client';
import { useExpenseCategories } from '@/hooks/use-expense-categories';

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
// 헬퍼: Firestore 문서 스냅샷 생성
// ============================================================
function makeCategoryDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  };
}

// ============================================================
// useExpenseCategories
// ============================================================
describe('useExpenseCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
  });

  it('기본 카테고리 목록을 가져온다', async () => {
    const defaultDocs = [
      makeCategoryDoc('cat-1', { name: '사료', icon: '🍖', color: '#FF5733', sortOrder: 1, isDefault: true }),
      makeCategoryDoc('cat-2', { name: '병원', icon: '🏥', color: '#3498DB', sortOrder: 2, isDefault: true }),
    ];

    (getDocs as Mock)
      .mockResolvedValueOnce({ docs: defaultDocs })
      .mockResolvedValueOnce({ docs: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]).toEqual({ id: 'cat-1', name: '사료', icon: '🍖', color: '#FF5733' });
    expect(result.current.data![1]).toEqual({ id: 'cat-2', name: '병원', icon: '🏥', color: '#3498DB' });
  });

  it('sortOrder로 정렬된다', async () => {
    // Firestore에서 orderBy('sortOrder')로 쿼리하므로, 모킹된 docs 순서가 정렬 결과를 대변함
    const defaultDocs = [
      makeCategoryDoc('cat-1', { name: '사료', icon: '🍖', color: '#FF5733', sortOrder: 1, isDefault: true }),
      makeCategoryDoc('cat-2', { name: '미용', icon: '✂️', color: '#9B59B6', sortOrder: 2, isDefault: true }),
      makeCategoryDoc('cat-3', { name: '병원', icon: '🏥', color: '#3498DB', sortOrder: 3, isDefault: true }),
    ];

    (getDocs as Mock)
      .mockResolvedValueOnce({ docs: defaultDocs })
      .mockResolvedValueOnce({ docs: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0].name).toBe('사료');
    expect(result.current.data![1].name).toBe('미용');
    expect(result.current.data![2].name).toBe('병원');
  });

  it('사용자 커스텀 카테고리가 기본 카테고리와 합쳐진다', async () => {
    const defaultDocs = [
      makeCategoryDoc('cat-default', { name: '사료', icon: '🍖', color: '#FF5733', sortOrder: 1, isDefault: true }),
    ];
    const userDocs = [
      makeCategoryDoc('cat-custom', { name: '장난감', icon: '🧸', color: '#F39C12', sortOrder: 1, isDefault: false }),
    ];

    (getDocs as Mock)
      .mockResolvedValueOnce({ docs: defaultDocs })
      .mockResolvedValueOnce({ docs: userDocs });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    // 기본 카테고리가 먼저, 사용자 카테고리가 뒤에 위치
    expect(result.current.data![0].id).toBe('cat-default');
    expect(result.current.data![1].id).toBe('cat-custom');
  });

  it('인증되지 않은 경우 기본 카테고리만 반환한다', async () => {
    (auth as { currentUser: null }).currentUser = null;

    const defaultDocs = [
      makeCategoryDoc('cat-1', { name: '사료', icon: '🍖', color: '#FF5733', sortOrder: 1, isDefault: true }),
    ];

    // uid가 없을 때 userSnap 쿼리가 null로 resolve됨 → getDocs는 한 번만 호출
    (getDocs as Mock).mockResolvedValueOnce({ docs: defaultDocs });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 기본 카테고리만 반환
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('cat-1');
  });

  it('Firestore 에러 시 에러 상태를 반환한다', async () => {
    (getDocs as Mock).mockRejectedValueOnce(new Error('Firestore unavailable'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Firestore unavailable');
  });
});

// ============================================================
// useExpenseCategories — 엣지 케이스
// ============================================================
describe('useExpenseCategories — 엣지 케이스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'test-user' };
  });

  it('기본 카테고리가 없을 때 사용자 카테고리만 반환한다', async () => {
    const userDocs = [
      makeCategoryDoc('cat-custom', { name: '장난감', icon: '🧸', color: '#F39C12', sortOrder: 1, isDefault: false }),
    ];

    (getDocs as Mock)
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: userDocs });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('cat-custom');
  });

  it('기본 카테고리와 사용자 카테고리가 모두 없으면 빈 배열을 반환한다', async () => {
    (getDocs as Mock)
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('카테고리 필드(id, name, icon, color)가 올바르게 매핑된다', async () => {
    const defaultDocs = [
      makeCategoryDoc('mapped-id', {
        name: '의료비',
        icon: '💊',
        color: '#E74C3C',
        sortOrder: 1,
        isDefault: true,
      }),
    ];

    (getDocs as Mock)
      .mockResolvedValueOnce({ docs: defaultDocs })
      .mockResolvedValueOnce({ docs: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0]).toEqual({
      id: 'mapped-id',
      name: '의료비',
      icon: '💊',
      color: '#E74C3C',
    });
  });

  it('여러 사용자 커스텀 카테고리가 기본 카테고리 뒤에 모두 포함된다', async () => {
    const defaultDocs = [
      makeCategoryDoc('default-1', { name: '사료', icon: '🍖', color: '#FF5733', sortOrder: 1, isDefault: true }),
    ];
    const userDocs = [
      makeCategoryDoc('custom-1', { name: '간식', icon: '🍬', color: '#2ECC71', sortOrder: 1, isDefault: false }),
      makeCategoryDoc('custom-2', { name: '장난감', icon: '🧸', color: '#F39C12', sortOrder: 2, isDefault: false }),
      makeCategoryDoc('custom-3', { name: '미용', icon: '✂️', color: '#9B59B6', sortOrder: 3, isDefault: false }),
    ];

    (getDocs as Mock)
      .mockResolvedValueOnce({ docs: defaultDocs })
      .mockResolvedValueOnce({ docs: userDocs });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(4);
    expect(result.current.data![0].id).toBe('default-1');
    expect(result.current.data![1].id).toBe('custom-1');
    expect(result.current.data![2].id).toBe('custom-2');
    expect(result.current.data![3].id).toBe('custom-3');
  });
});
