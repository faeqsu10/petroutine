import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ============================================================
// 훅 모킹
// ============================================================
const mockUpdateExpense = vi.fn();
const mockDeleteExpense = vi.fn();

const mockCategories = [
  { id: 'cat-1', name: '병원', icon: '🏥', color: '#EF4444' },
  { id: 'cat-2', name: '사료', icon: '🍖', color: '#F59E0B' },
];

vi.mock('@/hooks/use-expenses', () => ({
  useUpdateExpense: () => ({
    mutate: mockUpdateExpense,
    isPending: false,
  }),
  useDeleteExpense: () => ({
    mutate: mockDeleteExpense,
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-expense-categories', () => ({
  useExpenseCategories: () => ({
    data: mockCategories,
  }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 이후)
// ============================================================
import { ExpenseEditSheet } from '@/components/expenses/edit-sheet';
import type { Expense } from '@/types';

// ============================================================
// 픽스처
// ============================================================
function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    petId: 'pet-1',
    categoryId: 'cat-1',
    amount: 50000,
    description: '정기 예방접종',
    expenseDate: '2026-03-10',
    memo: null,
    ...overrides,
  };
}

function renderSheet(props: Partial<React.ComponentProps<typeof ExpenseEditSheet>> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    expense: makeExpense(),
  };
  return render(<ExpenseEditSheet {...defaults} {...props} />);
}

// ============================================================
// 테스트
// ============================================================
describe('ExpenseEditSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 렌더링 조건 ────────────────────────────────────────────
  describe('렌더링 조건', () => {
    it('expense가 null이고 open이 false이면 Sheet 콘텐츠를 렌더링하지 않는다', () => {
      renderSheet({ expense: null, open: false });
      expect(screen.queryByText('지출 수정')).not.toBeInTheDocument();
    });

    it('open이 true이고 expense가 있으면 Sheet 제목을 렌더링한다', () => {
      renderSheet();
      expect(screen.getByText('지출 수정')).toBeInTheDocument();
    });

    it('카테고리 목록이 렌더링된다', () => {
      renderSheet();
      expect(screen.getByText('병원')).toBeInTheDocument();
      expect(screen.getByText('사료')).toBeInTheDocument();
    });
  });

  // ─── 폼 초기값 ──────────────────────────────────────────────
  describe('폼 초기값', () => {
    it('expense의 description이 내용 입력 필드에 채워진다', () => {
      renderSheet({ expense: makeExpense({ description: '스케일링' }) });
      expect(screen.getByPlaceholderText('예: 정기 예방접종')).toHaveValue('스케일링');
    });

    it('expense의 expenseDate가 날짜 입력 필드에 채워진다', () => {
      renderSheet({ expense: makeExpense({ expenseDate: '2026-03-10' }) });
      expect(screen.getByDisplayValue('2026-03-10')).toBeInTheDocument();
    });

    it('expense의 memo가 메모 텍스트영역에 채워진다', () => {
      renderSheet({ expense: makeExpense({ memo: '카드 결제' }) });
      expect(screen.getByPlaceholderText('추가 메모')).toHaveValue('카드 결제');
    });

    it('expense의 memo가 null이면 메모 텍스트영역이 비어있다', () => {
      renderSheet({ expense: makeExpense({ memo: null }) });
      expect(screen.getByPlaceholderText('추가 메모')).toHaveValue('');
    });
  });

  // ─── 저장 버튼 ──────────────────────────────────────────────
  describe('저장 버튼', () => {
    it('클릭 시 useUpdateExpense의 mutate를 호출한다', async () => {
      renderSheet();

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateExpense).toHaveBeenCalledTimes(1);
    });

    it('mutate를 expense id와 현재 폼 값으로 호출한다', async () => {
      renderSheet({
        expense: makeExpense({ description: '정기 예방접종', amount: 50000 }),
      });

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'expense-1',
          description: '정기 예방접종',
          amount: 50000,
        }),
        expect.any(Object),
      );
    });

    it('amount가 0이면 저장 버튼이 비활성화된다', () => {
      renderSheet({ expense: makeExpense({ amount: 0 }) });
      expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });

    it('description이 비어있으면 저장 버튼이 비활성화된다', async () => {
      renderSheet({ expense: makeExpense({ description: '정기 예방접종' }) });

      const descInput = screen.getByPlaceholderText('예: 정기 예방접종');
      await userEvent.clear(descInput);

      expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });
  });

  // ─── 삭제 버튼 ──────────────────────────────────────────────
  describe('삭제 버튼', () => {
    it('클릭 시 ConfirmDialog가 표시된다', async () => {
      renderSheet();

      await userEvent.click(screen.getByRole('button', { name: '삭제' }));

      expect(screen.getByText('지출 삭제')).toBeInTheDocument();
    });

    it('ConfirmDialog의 확인 버튼 클릭 시 useDeleteExpense의 mutate를 호출한다', async () => {
      renderSheet();

      await userEvent.click(screen.getByRole('button', { name: '삭제' }));

      // ConfirmDialog는 role="dialog", name="지출 삭제"로 식별
      const confirmDialog = screen.getByRole('dialog', { name: '지출 삭제' });
      await userEvent.click(within(confirmDialog).getByRole('button', { name: '삭제' }));

      expect(mockDeleteExpense).toHaveBeenCalledWith(
        'expense-1',
        expect.any(Object),
      );
    });

    it('ConfirmDialog의 취소 버튼 클릭 시 dialog가 닫힌다', async () => {
      renderSheet();

      await userEvent.click(screen.getByRole('button', { name: '삭제' }));
      expect(screen.getByText('지출 삭제')).toBeInTheDocument();

      const confirmDialog = screen.getByRole('dialog', { name: '지출 삭제' });
      await userEvent.click(within(confirmDialog).getByRole('button', { name: '취소' }));

      expect(screen.queryByText('지출 삭제')).not.toBeInTheDocument();
    });

    it('useDeleteExpense mutate를 expense id로 호출한다', async () => {
      renderSheet({ expense: makeExpense({ id: 'expense-42' }) });

      await userEvent.click(screen.getByRole('button', { name: '삭제' }));
      const confirmDialog = screen.getByRole('dialog', { name: '지출 삭제' });
      await userEvent.click(within(confirmDialog).getByRole('button', { name: '삭제' }));

      expect(mockDeleteExpense).toHaveBeenCalledWith('expense-42', expect.any(Object));
    });
  });
});
