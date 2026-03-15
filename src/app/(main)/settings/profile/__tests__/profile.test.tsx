import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================
// next/navigation 모킹
// ============================================================
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/settings/profile',
}));

// ============================================================
// next/image 모킹
// ============================================================
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement('img', { src, alt, ...props }),
}));

// ============================================================
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    header: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('header', props, children),
    section: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('section', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// lucide-react 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  ChevronLeft: () => React.createElement('span', { 'data-testid': 'icon-chevron-left' }),
  User: () => React.createElement('span', { 'data-testid': 'icon-user' }),
  Calendar: () => React.createElement('span', { 'data-testid': 'icon-calendar' }),
  PawPrint: () => React.createElement('span', { 'data-testid': 'icon-pawprint' }),
  ClipboardList: () => React.createElement('span', { 'data-testid': 'icon-clipboard' }),
}));

// ============================================================
// Firebase 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  auth: {},
}));

const mockOnAuthStateChanged = vi.fn();
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

// ============================================================
// 훅 모킹
// ============================================================
const mockUsePets = vi.fn();
const mockUseCareItems = vi.fn();

vi.mock('@/hooks/use-pets', () => ({
  usePets: () => mockUsePets(),
}));

vi.mock('@/hooks/use-care-items', () => ({
  useCareItems: () => mockUseCareItems(),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 이후)
// ============================================================
import ProfilePage from '../page';

// ============================================================
// 테스트
// ============================================================
describe('ProfilePage (프로필)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePets.mockReturnValue({ data: [] });
    mockUseCareItems.mockReturnValue({ data: [] });
    // 기본: auth 초기화되지 않은 상태 (user=null)
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return vi.fn();
      },
    );
  });

  it('프로필 페이지가 렌더링된다', () => {
    render(<ProfilePage />);
    expect(screen.getByText('프로필')).toBeInTheDocument();
  });

  it('뒤로가기 버튼이 표시된다', () => {
    render(<ProfilePage />);
    expect(screen.getByTestId('icon-chevron-left')).toBeInTheDocument();
  });

  it('"Google 계정에서 관리됩니다" 안내가 표시된다', () => {
    render(<ProfilePage />);
    expect(
      screen.getByText(/Google 계정에서 관리됩니다/),
    ).toBeInTheDocument();
  });

  it('사용자 이메일이 표시된다', async () => {
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: { email: string; displayName: string; photoURL: null; metadata: { creationTime: string } }) => void) => {
        callback({
          email: 'test@example.com',
          displayName: '테스트 유저',
          photoURL: null,
          metadata: { creationTime: '2024-01-01T00:00:00Z' },
        });
        return vi.fn();
      },
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('로딩 중일 때(user가 null) 기본 "사용자" 표시 이름이 나타난다', () => {
    // onAuthStateChanged가 아직 콜백을 호출하지 않은 상태
    mockOnAuthStateChanged.mockImplementation(() => vi.fn());

    render(<ProfilePage />);

    // user가 null이면 displayName 대신 '사용자' 텍스트가 표시됨
    expect(screen.getByText('사용자')).toBeInTheDocument();
  });
});
