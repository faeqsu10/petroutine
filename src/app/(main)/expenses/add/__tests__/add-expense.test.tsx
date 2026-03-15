import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// 훅 모킹
// ============================================================
const mockCreateExpenseMutateAsync = vi.fn().mockResolvedValue({ id: 'expense-1' });
const mockCreateCategoryMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/use-expense-categories', () => ({
  useExpenseCategories: vi.fn(() => ({
    data: [
      { id: 'cat-1', name: '병원', icon: '🏥', color: '#6366f1' },
      { id: 'cat-2', name: '사료', icon: '🍖', color: '#f97316' },
    ],
    isLoading: false,
  })),
  useCreateExpenseCategory: vi.fn(() => ({
    mutateAsync: mockCreateCategoryMutateAsync,
    isPending: false,
  })),
}));

vi.mock('@/hooks/use-pets', () => ({
  usePets: vi.fn(() => ({
    data: [
      { id: 'pet-1', name: '초코', species: 'dog' },
      { id: 'pet-2', name: '나비', species: 'cat' },
    ],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/use-expenses', () => ({
  useCreateExpense: vi.fn(() => ({
    mutateAsync: mockCreateExpenseMutateAsync,
    isPending: false,
  })),
}));

// ============================================================
// Firebase 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  limit: vi.fn(),
  documentId: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/expenses/add',
}));

// ============================================================
// next/link 모킹
// ============================================================
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

// ============================================================
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, variants, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// lucide-react 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  ChevronLeft: () => React.createElement('span', { 'data-testid': 'icon-chevron-left' }),
  Plus: () => React.createElement('span', { 'data-testid': 'icon-plus' }),
}));

// ============================================================
// shadcn 컴포넌트 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    type,
    variant,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    variant?: string;
    className?: string;
    onClick?: () => void;
  }) =>
    React.createElement(
      'button',
      { disabled, type: type ?? 'button', className, onClick },
      children,
    ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    React.createElement('input', props),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, className, htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) =>
    React.createElement('label', { className, htmlFor }, children),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
    React.createElement('textarea', props),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) =>
    open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className }, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('h2', { className }, children),
  DialogFooter: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className }, children),
}));

// ============================================================
// sonner 모킹
// ============================================================
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================
// cn 유틸리티 모킹
// ============================================================
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
  chunkArray: (arr: unknown[], size: number): unknown[][] => {
    const result: unknown[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  },
}));

// ============================================================
// date-fns 모킹
// ============================================================
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2026-03-15'),
  endOfMonth: vi.fn(() => new Date('2026-03-31')),
}));

// ============================================================
// constants 모킹
// ============================================================
vi.mock('@/lib/constants', () => ({
  BOTTOM_NAV_PADDING: 'pb-32',
  EXPENSE_PRESET_ICONS: ['🐾', '💊', '🏥', '✂️', '🛁', '🧸'],
  EXPENSE_PRESET_COLORS: ['#6366f1', '#f97316', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b'],
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import AddExpensePage from '../page';
import { useExpenseCategories, useCreateExpenseCategory } from '@/hooks/use-expense-categories';
import { useCreateExpense } from '@/hooks/use-expenses';

// ============================================================
// 테스트
// ============================================================
describe('AddExpensePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExpenseCategories).mockReturnValue({
      data: [
        { id: 'cat-1', name: '병원', icon: '🏥', color: '#6366f1' },
        { id: 'cat-2', name: '사료', icon: '🍖', color: '#f97316' },
      ],
      isLoading: false,
    } as ReturnType<typeof useExpenseCategories>);
    vi.mocked(useCreateExpenseCategory).mockReturnValue({
      mutateAsync: mockCreateCategoryMutateAsync,
      isPending: false,
    } as ReturnType<typeof useCreateExpenseCategory>);
    vi.mocked(useCreateExpense).mockReturnValue({
      mutateAsync: mockCreateExpenseMutateAsync,
      isPending: false,
    } as ReturnType<typeof useCreateExpense>);
  });

  it('지출 추가 페이지가 렌더링된다', () => {
    render(<AddExpensePage />);
    expect(screen.getByText('지출 추가')).toBeInTheDocument();
    expect(screen.getByText('아이에게 사용한 비용을 기록하세요')).toBeInTheDocument();
  });

  it('금액 입력 필드가 표시된다', () => {
    render(<AddExpensePage />);
    expect(screen.getByText('지출 금액')).toBeInTheDocument();
    const amountInput = screen.getByPlaceholderText('0');
    expect(amountInput).toBeInTheDocument();
    expect(amountInput).toHaveAttribute('type', 'number');
  });

  it('카테고리 선택 그리드가 표시된다', () => {
    render(<AddExpensePage />);
    expect(screen.getByText('병원')).toBeInTheDocument();
    expect(screen.getByText('사료')).toBeInTheDocument();
  });

  it('"공통" 반려동물 버튼이 표시된다', () => {
    render(<AddExpensePage />);
    expect(screen.getByRole('button', { name: '공통' })).toBeInTheDocument();
  });

  it('커스텀 카테고리 추가(+) 버튼이 표시된다', () => {
    render(<AddExpensePage />);
    expect(screen.getByText('추가')).toBeInTheDocument();
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('저장 버튼이 표시된다', () => {
    render(<AddExpensePage />);
    expect(screen.getByRole('button', { name: '지출 내역 저장하기' })).toBeInTheDocument();
  });
});
