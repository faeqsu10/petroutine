import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// 훅 모킹
// ============================================================
const mockCreateCareItem = vi.fn();

vi.mock('@/hooks/use-pets', () => ({
  usePets: vi.fn(() => ({
    data: [{ id: 'pet-1', name: '초코', species: 'dog' }],
  })),
}));

vi.mock('@/stores/care-store', () => ({
  useCareStore: vi.fn((selector: (s: { selectedPetId: string | null }) => unknown) =>
    selector({ selectedPetId: 'pet-1' }),
  ),
}));

vi.mock('@/hooks/use-create-care-item', () => ({
  useCreateCareItem: vi.fn(() => ({
    mutate: mockCreateCareItem,
    isPending: false,
  })),
}));

vi.mock('@/hooks/use-care-items', () => ({
  useCareItems: vi.fn(() => ({
    data: [],
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
  writeBatch: vi.fn(),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/care/add',
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

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('label', { className }, children),
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
        value: name === 'category' ? 'hygiene' : name === 'cycleUnit' ? 'week' : name === 'cycleValue' ? 1 : name === 'icon' ? '🐾' : name === 'color' ? '#FF7E5F' : name === 'notifyEnabled' ? true : '',
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
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => React.createElement('div', { 'data-testid': 'select', 'data-value': value }, children),
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
}));

// ============================================================
// constants 모킹
// ============================================================
vi.mock('@/lib/constants', () => ({
  BOTTOM_NAV_PADDING: 'pb-32',
  PRESET_COLORS: ['#FF7E5F', '#FFB347', '#48C6EF', '#6B8DD6', '#764BA2', '#6A11CB'],
  PRESET_ICONS: ['🛁', '💊', '💉', '✂️', '🦷', '🐾', '🍖', '🏥', '🧴', '👁️', '🦴', '🚿'],
  CARE_TEMPLATES: [
    { name: '목욕', category: 'hygiene', icon: '🛁', cycleValue: 2, cycleUnit: 'week' },
    { name: '발톱 깎기', category: 'hygiene', icon: '✂️', cycleValue: 2, cycleUnit: 'week' },
    { name: '심장사상충 약', category: 'health', icon: '💊', cycleValue: 1, cycleUnit: 'month' },
    { name: '건강 검진', category: 'health', icon: '🏥', cycleValue: 6, cycleUnit: 'month' },
    { name: '산책', category: 'daily', icon: '🐾', cycleValue: 1, cycleUnit: 'day' },
    { name: '사료 구매', category: 'daily', icon: '🍖', cycleValue: 1, cycleUnit: 'month' },
  ],
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import AddCareItemPage from '../page';
import { useCreateCareItem } from '@/hooks/use-create-care-item';
import { useCareItems } from '@/hooks/use-care-items';

// ============================================================
// 테스트
// ============================================================
describe('AddCareItemPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateCareItem).mockReturnValue({
      mutate: mockCreateCareItem,
      isPending: false,
    } as ReturnType<typeof useCreateCareItem>);
    vi.mocked(useCareItems).mockReturnValue({
      data: [],
    } as ReturnType<typeof useCareItems>);
  });

  it('케어 추가 페이지가 렌더링된다', () => {
    render(<AddCareItemPage />);
    expect(screen.getByText('케어 항목 추가')).toBeInTheDocument();
    expect(screen.getByText('아이의 건강한 루틴을 만들어주세요')).toBeInTheDocument();
  });

  it('템플릿 선택 섹션이 표시된다', () => {
    render(<AddCareItemPage />);
    expect(screen.getByText('템플릿에서 선택')).toBeInTheDocument();
    expect(screen.getByText('탭하면 폼이 자동으로 채워져요')).toBeInTheDocument();
  });

  it('카테고리 탭(위생/건강/생활)이 표시된다', () => {
    render(<AddCareItemPage />);
    // 템플릿 섹션 탭과 Select 옵션에 중복으로 나타날 수 있으므로 getAllByText 사용
    expect(screen.getAllByText('위생').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('건강').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('생활').length).toBeGreaterThanOrEqual(1);
  });

  it('이미 등록된 템플릿은 "등록됨"으로 표시된다', () => {
    vi.mocked(useCareItems).mockReturnValue({
      data: [
        {
          id: 'care-1',
          petId: 'pet-1',
          name: '목욕',
          category: 'hygiene',
          cycleValue: 2,
          cycleUnit: 'week',
          icon: '🛁',
          color: '#FF7E5F',
          isActive: true,
          notifyEnabled: true,
          schedule: null,
          lastLog: null,
        },
      ],
    } as ReturnType<typeof useCareItems>);
    render(<AddCareItemPage />);
    expect(screen.getByText('등록됨')).toBeInTheDocument();
  });

  it('폼 필드(이름, 카테고리, 주기)가 표시된다', () => {
    render(<AddCareItemPage />);
    expect(screen.getByPlaceholderText('예: 목욕, 심장사상충 약')).toBeInTheDocument();
    expect(screen.getByText('카테고리')).toBeInTheDocument();
    expect(screen.getByText('실행 주기')).toBeInTheDocument();
  });

  it('저장 버튼이 표시된다', () => {
    render(<AddCareItemPage />);
    expect(screen.getByRole('button', { name: '케어 항목 저장하기' })).toBeInTheDocument();
  });
});
