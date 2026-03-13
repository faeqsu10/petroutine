import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// 훅 모킹
// ============================================================
const mockPets = [
  { id: 'pet-1', name: '초코', species: 'dog', breed: '말티즈' },
  { id: 'pet-2', name: '나비', species: 'cat', breed: null },
];

vi.mock('@/hooks/use-pets', () => ({
  usePets: vi.fn(() => ({ data: mockPets })),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  usePathname: () => '/settings',
}));

// ============================================================
// next/link 모킹
// ============================================================
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

// ============================================================
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, variants, whileHover, whileTap, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    section: ({ children, initial, animate, transition, variants, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// lucide-react 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  ChevronRight: () => React.createElement('span', { 'data-testid': 'icon-chevron-right' }),
  Bell: () => React.createElement('span', { 'data-testid': 'icon-bell' }),
  User: () => React.createElement('span', { 'data-testid': 'icon-user' }),
  LogOut: () => React.createElement('span', { 'data-testid': 'icon-logout' }),
  Plus: () => React.createElement('span', { 'data-testid': 'icon-plus' }),
}));

// ============================================================
// shadcn 컴포넌트 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
  }) => React.createElement('button', { onClick, className, 'data-variant': variant }, children),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className, 'data-testid': 'card' }, children),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => React.createElement('hr'),
}));

// ============================================================
// firebase 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import SettingsPage from '../page';
import { usePets } from '@/hooks/use-pets';

// ============================================================
// 테스트
// ============================================================
describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePets).mockReturnValue({ data: mockPets } as ReturnType<typeof usePets>);
  });

  it('설정 페이지 제목이 표시된다', () => {
    render(<SettingsPage />);
    expect(screen.getByText('설정')).toBeInTheDocument();
  });

  it('반려동물 목록이 표시된다', () => {
    render(<SettingsPage />);
    expect(screen.getByText('초코')).toBeInTheDocument();
    expect(screen.getByText('나비')).toBeInTheDocument();
  });

  it('반려동물 이름을 클릭하면 편집 페이지로 이동한다', () => {
    render(<SettingsPage />);
    const chocoLink = screen.getByText('초코').closest('a');
    expect(chocoLink).toHaveAttribute('href', '/pets/pet-1/edit');

    const nabiLink = screen.getByText('나비').closest('a');
    expect(nabiLink).toHaveAttribute('href', '/pets/pet-2/edit');
  });

  it('반려동물 추가 버튼이 표시된다', () => {
    render(<SettingsPage />);
    const addLink = screen.getByText('우리 아이 추가하기').closest('a');
    expect(addLink).toHaveAttribute('href', '/pets/add');
  });

  it('로그아웃 버튼이 표시된다', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('button', { name: /로그아웃/ })).toBeInTheDocument();
  });

  it('로딩 중일 때 반려동물 목록 없이 렌더링된다', () => {
    vi.mocked(usePets).mockReturnValue({ data: undefined } as ReturnType<typeof usePets>);
    render(<SettingsPage />);
    expect(screen.queryByText('초코')).not.toBeInTheDocument();
    expect(screen.queryByText('나비')).not.toBeInTheDocument();
    // 제목은 여전히 표시된다
    expect(screen.getByText('설정')).toBeInTheDocument();
  });
});
