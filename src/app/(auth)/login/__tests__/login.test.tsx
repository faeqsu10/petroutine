import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// firebase 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn().mockResolvedValue(null),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/login',
}));

// ============================================================
// shadcn 컴포넌트 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    onClick,
    className,
    variant,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    variant?: string;
  }) =>
    React.createElement(
      'button',
      { disabled, onClick, className, 'data-variant': variant },
      children,
    ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className, 'data-testid': 'card' }, children),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className }, children),
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import LoginPage from '../page';

// ============================================================
// 테스트
// ============================================================
describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그인 페이지가 렌더링된다', () => {
    render(<LoginPage />);
    expect(screen.getByText('Petroutine')).toBeInTheDocument();
  });

  it('앱 로고(타이틀)가 표시된다', () => {
    render(<LoginPage />);
    const title = screen.getByText('Petroutine');
    expect(title).toBeInTheDocument();
    // h1 태그인지 확인
    expect(title.tagName).toBe('H1');
  });

  it('Google 로그인 버튼이 표시된다', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Google로 시작하기' })).toBeInTheDocument();
  });

  it('카카오 로그인 버튼이 준비중 상태로 표시된다', () => {
    render(<LoginPage />);
    const kakaoBtn = screen.getByRole('button', { name: '카카오로 시작하기 (준비 중)' });
    expect(kakaoBtn).toBeInTheDocument();
    expect(kakaoBtn).toBeDisabled();
  });

  it('앱 소개 텍스트가 표시된다', () => {
    render(<LoginPage />);
    expect(screen.getByText('기억에 의존하지 않는 반려동물 관리')).toBeInTheDocument();
  });
});
