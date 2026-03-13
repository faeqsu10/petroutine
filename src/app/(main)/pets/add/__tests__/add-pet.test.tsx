import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ============================================================
// 훅 모킹
// ============================================================
const mockMutateAsync = vi.fn().mockResolvedValue({ id: 'new-pet' });

vi.mock('@/hooks/use-pets', () => ({
  useCreatePet: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
  })),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/pets/add',
}));

// ============================================================
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, variants, whileHover, whileTap, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// lucide-react 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  ChevronLeft: () => React.createElement('span', { 'data-testid': 'icon-chevron-left' }),
}));

// ============================================================
// shadcn 컴포넌트 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    type,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
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

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  FormField: ({
    render,
    name,
    control,
  }: {
    render: (arg: { field: Record<string, unknown> }) => React.ReactNode;
    name: string;
    control: unknown;
  }) =>
    render({
      field: {
        name,
        value: name === 'species' ? 'dog' : name === 'gender' ? 'unknown' : name === 'neutered' ? false : '',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      },
    }) as React.ReactElement,
  FormItem: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  FormLabel: ({ children }: { children: React.ReactNode }) =>
    React.createElement('label', null, children),
  FormControl: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  FormMessage: () => null,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    defaultValue,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    defaultValue?: string;
  }) => React.createElement('div', { 'data-testid': 'select', 'data-value': defaultValue }, children),
  SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { role: 'combobox', className }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    React.createElement('span', null, placeholder),
  SelectContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) =>
    React.createElement('option', { value }, children),
}));

// ============================================================
// cn 유틸리티 모킹
// ============================================================
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import AddPetPage from '../page';
import { useCreatePet } from '@/hooks/use-pets';

// ============================================================
// 테스트
// ============================================================
describe('AddPetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreatePet).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
    } as ReturnType<typeof useCreatePet>);
  });

  it('반려동물 등록 폼이 표시된다', () => {
    render(<AddPetPage />);
    expect(screen.getByText('반려동물 등록')).toBeInTheDocument();
    expect(screen.getByText('우리 아이의 소중한 정보를 알려주세요')).toBeInTheDocument();
  });

  it('이름 필드가 존재한다', () => {
    render(<AddPetPage />);
    const nameInput = screen.getByPlaceholderText('예: 초코, 나비');
    expect(nameInput).toBeInTheDocument();
  });

  it('종류(species) 선택 드롭다운이 있다', () => {
    render(<AddPetPage />);
    // Select 컴포넌트가 렌더링된다 (combobox role)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('등록하기 버튼이 표시된다', () => {
    render(<AddPetPage />);
    expect(screen.getByRole('button', { name: '아이 등록 완료하기' })).toBeInTheDocument();
  });

  it('isPending이 true일 때 버튼이 "등록 중..." 텍스트를 표시하며 비활성화된다', () => {
    vi.mocked(useCreatePet).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
    } as ReturnType<typeof useCreatePet>);

    render(<AddPetPage />);
    const btn = screen.getByRole('button', { name: '등록 중...' });
    expect(btn).toBeDisabled();
  });

  it('이름 레이블이 필수 표시(*)와 함께 렌더링된다', () => {
    render(<AddPetPage />);
    // 이름 레이블 텍스트가 있어야 한다
    expect(screen.getByText(/이름/)).toBeInTheDocument();
    // 필수 표시 * 가 있어야 한다
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
