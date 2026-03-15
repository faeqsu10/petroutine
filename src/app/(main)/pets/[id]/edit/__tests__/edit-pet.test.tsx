import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// 훅 모킹
// ============================================================
const mockUpdateMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockDeleteMutate = vi.fn();

vi.mock('@/hooks/use-pets', () => ({
  usePets: vi.fn(() => ({
    data: [
      {
        id: 'pet-1',
        name: '초코',
        species: 'dog',
        breed: '말티즈',
        birthDate: '2020-01-01',
        gender: 'male',
        neutered: true,
        weightKg: 3.5,
        avatarUrl: null,
      },
    ],
  })),
  useUpdatePet: vi.fn(() => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
    isError: false,
  })),
  useDeletePet: vi.fn(() => ({
    mutate: mockDeleteMutate,
    isPending: false,
  })),
  uploadAvatar: vi.fn().mockResolvedValue('https://example.com/avatar.jpg'),
}));

// ============================================================
// Firebase 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  updateDoc: vi.fn().mockResolvedValue(undefined),
  doc: vi.fn(() => ({})),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

// ============================================================
// next/image 모킹
// ============================================================
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement('img', { src, alt, ...props }),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useParams: () => ({ id: 'pet-1' }),
  usePathname: () => '/pets/pet-1/edit',
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
  Camera: () => React.createElement('span', { 'data-testid': 'icon-camera' }),
  Trash2: () => React.createElement('span', { 'data-testid': 'icon-trash2' }),
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
        value: name === 'species' ? 'dog' : name === 'gender' ? 'male' : name === 'neutered' ? true : name === 'name' ? '초코' : '',
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
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    defaultValue?: string;
    value?: string;
  }) => React.createElement('div', { 'data-testid': 'select', 'data-value': defaultValue ?? value }, children),
  SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { role: 'combobox', className }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    React.createElement('span', null, placeholder),
  SelectContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) =>
    React.createElement('option', { value }, children),
}));

vi.mock('@/components/shared/confirm-dialog', () => ({
  ConfirmDialog: ({
    open,
    title,
  }: {
    open: boolean;
    title: string;
    onOpenChange?: (open: boolean) => void;
    description?: string;
    onConfirm?: () => void;
    isPending?: boolean;
  }) =>
    open ? React.createElement('div', { 'data-testid': 'confirm-dialog' }, title) : null,
}));

// ============================================================
// sonner 모킹
// ============================================================
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// ============================================================
// cn 유틸리티 모킹
// ============================================================
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================
// constants 모킹
// ============================================================
vi.mock('@/lib/constants', () => ({
  BOTTOM_NAV_PADDING: 'pb-32',
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import EditPetPage from '../page';
import { usePets, useUpdatePet, useDeletePet } from '@/hooks/use-pets';

// ============================================================
// 테스트
// ============================================================
describe('EditPetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePets).mockReturnValue({
      data: [
        {
          id: 'pet-1',
          name: '초코',
          species: 'dog',
          breed: '말티즈',
          birthDate: '2020-01-01',
          gender: 'male',
          neutered: true,
          weightKg: 3.5,
          avatarUrl: null,
        },
      ],
    } as ReturnType<typeof usePets>);
    vi.mocked(useUpdatePet).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
      isError: false,
    } as ReturnType<typeof useUpdatePet>);
    vi.mocked(useDeletePet).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as ReturnType<typeof useDeletePet>);
  });

  it('편집 페이지가 렌더링된다', () => {
    render(<EditPetPage />);
    expect(screen.getByText('반려동물 수정')).toBeInTheDocument();
  });

  it('기존 반려동물 데이터가 폼에 채워진다', () => {
    render(<EditPetPage />);
    // 이름 입력 필드에 기존 값이 채워진다
    const nameInput = screen.getByPlaceholderText('예: 초코, 나비');
    expect(nameInput).toBeInTheDocument();
    // 헤더에 pet.name이 표시된다
    expect(screen.getByText('초코의 정보를 수정합니다')).toBeInTheDocument();
  });

  it('수정 완료 버튼이 표시된다', () => {
    render(<EditPetPage />);
    expect(screen.getByRole('button', { name: '정보 수정 완료하기' })).toBeInTheDocument();
  });

  it('삭제 버튼이 표시된다', () => {
    render(<EditPetPage />);
    expect(screen.getByText('반려동물 삭제하기')).toBeInTheDocument();
  });

  it('뒤로가기 버튼이 표시된다', () => {
    render(<EditPetPage />);
    expect(screen.getByText('뒤로가기')).toBeInTheDocument();
  });

  it('아바타 업로드 영역이 표시된다', () => {
    render(<EditPetPage />);
    expect(screen.getByText('프로필 사진 변경 (선택)')).toBeInTheDocument();
    expect(screen.getByTestId('icon-camera')).toBeInTheDocument();
  });
});
