import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// next/link 모킹
// ============================================================
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}));

// ============================================================
// lucide-react 아이콘 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  Plus: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'Plus'),
  ChevronLeft: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'ChevronLeft'),
  ChevronRight: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'ChevronRight'),
}));

// ============================================================
// shadcn Button 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    size?: string;
    [key: string]: unknown;
  }) => React.createElement('button', { onClick, className, ...props }, children),
}));

// ============================================================
// ExpenseEditSheet 모킹
// ============================================================
vi.mock('@/components/expenses/edit-sheet', () => ({
  ExpenseEditSheet: () => null,
}));

// ============================================================
// date-fns 모킹 — 날짜를 고정하여 스냅샷 안정성 확보
// ============================================================
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('date-fns')>();
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      // 월 헤더 포맷만 고정 (locale 사용 포맷)
      if (formatStr === 'yyyy년 M월') return '2026년 3월';
      if (formatStr === 'yyyy-MM') return '2026-03';
      // 나머지는 실제 구현 사용
      return actual.format(date, formatStr);
    }),
    addMonths: actual.addMonths,
    subMonths: actual.subMonths,
  };
});

vi.mock('date-fns/locale', () => ({ ko: {} }));

// ============================================================
// 훅 모킹
// ============================================================
const mockUseExpenses = vi.fn();
const mockUseMonthlyStats = vi.fn();

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: () => mockUseExpenses(),
  useMonthlyStats: (month: string) => mockUseMonthlyStats(month),
}));

const mockUsePets = vi.fn();
vi.mock('@/hooks/use-pets', () => ({
  usePets: () => mockUsePets(),
}));

// ============================================================
// 유틸 모킹
// ============================================================
vi.mock('@/lib/utils', () => ({
  formatCurrency: vi.fn((n: number) => `₩${n.toLocaleString()}`),
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import ExpensesPage from '../page';

// ============================================================
// 픽스처
// ============================================================
const mockExpense1 = {
  id: 'expense-1',
  petId: 'pet-1',
  categoryId: 'cat-1',
  amount: 30000,
  description: '사료 구매',
  expenseDate: '2026-03-10',
  memo: null,
};

const mockExpense2 = {
  id: 'expense-2',
  petId: 'pet-1',
  categoryId: 'cat-2',
  amount: 50000,
  description: '병원비',
  expenseDate: '2026-03-05',
  memo: null,
};

const mockStats = {
  month: '2026-03',
  totalAmount: 80000,
  byCategory: [
    { categoryId: 'cat-1', name: '사료', amount: 30000, icon: '🍚', color: '#4CAF50' },
    { categoryId: 'cat-2', name: '병원', amount: 50000, icon: '💊', color: '#F44336' },
  ],
  byPet: [],
};

// ============================================================
// 테스트
// ============================================================
describe('ExpensesPage (가계부)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePets.mockReturnValue({ data: [{ id: 'pet-1', name: '초코' }], isLoading: false });
  });

  // ─── 기본 렌더링 ──────────────────────────────────────────────
  describe('기본 렌더링', () => {
    it('지출 페이지가 렌더링된다', () => {
      mockUseMonthlyStats.mockReturnValue({ data: undefined });
      mockUseExpenses.mockReturnValue({ data: [] });

      render(<ExpensesPage />);

      expect(screen.getByText('가계부')).toBeInTheDocument();
    });

    it('지출 추가 버튼이 표시된다', () => {
      mockUseMonthlyStats.mockReturnValue({ data: undefined });
      mockUseExpenses.mockReturnValue({ data: [] });

      render(<ExpensesPage />);

      // floating 버튼은 link로 감싸져 있으므로 Plus 아이콘을 포함하는 링크 확인
      const links = screen.getAllByRole('link');
      const addLink = links.find((l) => l.getAttribute('href') === '/expenses/add');
      expect(addLink).toBeDefined();
    });
  });

  // ─── 월별 총지출 ──────────────────────────────────────────────
  describe('월별 총지출', () => {
    it('월별 총 지출 금액이 표시된다', () => {
      mockUseMonthlyStats.mockReturnValue({ data: mockStats });
      mockUseExpenses.mockReturnValue({ data: [mockExpense1, mockExpense2] });

      render(<ExpensesPage />);

      // formatCurrency(80000) → ₩80,000
      expect(screen.getByText('₩80,000')).toBeInTheDocument();
    });

    it('stats가 없을 때 ₩0을 표시한다', () => {
      mockUseMonthlyStats.mockReturnValue({ data: undefined });
      mockUseExpenses.mockReturnValue({ data: [] });

      render(<ExpensesPage />);

      expect(screen.getByText('₩0')).toBeInTheDocument();
    });
  });

  // ─── 지출 항목 목록 ───────────────────────────────────────────
  describe('지출 항목 목록', () => {
    it('지출 항목 목록이 표시된다', () => {
      mockUseMonthlyStats.mockReturnValue({ data: mockStats });
      mockUseExpenses.mockReturnValue({ data: [mockExpense1, mockExpense2] });

      render(<ExpensesPage />);

      expect(screen.getByText('사료 구매')).toBeInTheDocument();
      expect(screen.getByText('병원비')).toBeInTheDocument();
    });

    it('지출 항목의 금액이 표시된다', () => {
      // stats 없이 expense만 있을 때 — 중복 없이 금액 하나만 렌더링됨
      mockUseMonthlyStats.mockReturnValue({ data: undefined });
      mockUseExpenses.mockReturnValue({ data: [mockExpense1] });

      render(<ExpensesPage />);

      expect(screen.getByText('₩30,000')).toBeInTheDocument();
    });

    it('지출 항목이 없으면 빈 상태 메시지를 표시한다', () => {
      mockUseMonthlyStats.mockReturnValue({ data: undefined });
      mockUseExpenses.mockReturnValue({ data: [] });

      render(<ExpensesPage />);

      expect(screen.getByText('아직 기록된 지출이 없어요')).toBeInTheDocument();
    });
  });

  // ─── 카테고리별 ───────────────────────────────────────────────
  describe('카테고리별 지출', () => {
    it('카테고리별 지출이 표시된다', () => {
      mockUseMonthlyStats.mockReturnValue({ data: mockStats });
      mockUseExpenses.mockReturnValue({ data: [mockExpense1, mockExpense2] });

      render(<ExpensesPage />);

      expect(screen.getByText('사료')).toBeInTheDocument();
      expect(screen.getByText('병원')).toBeInTheDocument();
    });

    it('카테고리별 지출이 없으면 카테고리 섹션을 렌더링하지 않는다', () => {
      mockUseMonthlyStats.mockReturnValue({
        data: { ...mockStats, totalAmount: 0, byCategory: [] },
      });
      mockUseExpenses.mockReturnValue({ data: [] });

      render(<ExpensesPage />);

      expect(screen.queryByText('카테고리별')).not.toBeInTheDocument();
    });
  });
});
