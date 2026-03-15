import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================
// firebase 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  auth: {},
  db: {},
}));

const mockGetFirebaseAuthDomainMismatch = vi.fn().mockReturnValue(null);
const mockGetFirebaseAuthDomainMismatchMessage = vi.fn().mockReturnValue('로그인 설정 오류');
vi.mock('@/lib/firebase/auth-domain', () => ({
  getFirebaseAuthDomainMismatch: (...args: unknown[]) => mockGetFirebaseAuthDomainMismatch(...args),
  getFirebaseAuthDomainMismatchMessage: (...args: unknown[]) => mockGetFirebaseAuthDomainMismatchMessage(...args),
}));

vi.mock('@/lib/firebase/config', () => ({
  firebaseConfig: {
    authDomain: 'petroutine-ielc.vercel.app',
  },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

const mockSetCustomParameters = vi.fn();
const mockGetRedirectResult = vi.fn().mockResolvedValue(null);
const mockOnAuthStateChanged = vi.fn((_, callback: (user: null) => void) => {
  callback(null);
  return vi.fn();
});
const mockSignInWithRedirect = vi.fn().mockResolvedValue(undefined);
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(function MockGoogleAuthProvider(this: { setCustomParameters: typeof mockSetCustomParameters }) {
    this.setCustomParameters = mockSetCustomParameters;
  }),
  getRedirectResult: (...args: unknown[]) => mockGetRedirectResult(...args),
  signInWithRedirect: (...args: unknown[]) => mockSignInWithRedirect(...args),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...(args as [unknown, (user: null) => void])),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockFetch = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/login',
}));

const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
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
    mockGetRedirectResult.mockResolvedValue(null);
    mockGetFirebaseAuthDomainMismatch.mockReturnValue(null);
    mockGetFirebaseAuthDomainMismatchMessage.mockReturnValue('로그인 설정 오류');
    mockOnAuthStateChanged.mockImplementation((_, callback: (user: null) => void) => {
      callback(null);
      return vi.fn();
    });
    mockFetch.mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
  });

  it('로그인 페이지가 렌더링된다', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByText('Petroutine')).toBeInTheDocument());
  });

  it('앱 로고(타이틀)가 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => {
      const title = screen.getByText('Petroutine');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });
  });

  it('Google 로그인 버튼이 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Google로 시작하기' })).toBeInTheDocument());
  });

  it('카카오 로그인 버튼이 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => {
      const kakaoBtn = screen.getByRole('button', { name: '카카오로 시작하기' });
      expect(kakaoBtn).toBeInTheDocument();
      expect(kakaoBtn).not.toBeDisabled();
    });
  });

  it('앱 소개 텍스트가 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByText('기억에 의존하지 않는 반려동물 관리')).toBeInTheDocument());
  });

  it('Google 로그인 시 계정 선택 화면을 강제한다', async () => {
    render(<LoginPage />);

    const googleButton = await screen.findByRole('button', { name: 'Google로 시작하기' });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSetCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
      expect(mockSignInWithRedirect).toHaveBeenCalled();
    });
  });

  it('redirect 로그인 복귀 시 세션 생성 후 홈으로 이동한다', async () => {
    const redirectUser = {
      getIdToken: vi.fn().mockResolvedValue('redirect-token'),
    };
    mockGetRedirectResult.mockResolvedValue({ user: redirectUser });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'redirect-token' }),
      });
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('authDomain 설정이 현재 앱 도메인과 다르면 로그인 버튼이 비활성화된다', async () => {
    mockGetFirebaseAuthDomainMismatch.mockReturnValue({
      configuredAuthDomain: 'petroutine-2b8fd.firebaseapp.com',
      currentHost: 'petroutine-ielc.vercel.app',
      usesFirebaseHostedDomain: true,
    });

    render(<LoginPage />);

    const googleButton = await screen.findByRole('button', { name: 'Google로 시작하기' });
    expect(googleButton).toBeDisabled();
    expect(screen.getByText('로그인 설정 오류')).toBeInTheDocument();
  });

  it('authDomain 설정이 잘못되면 redirect 로그인을 시작하지 않는다', async () => {
    mockGetFirebaseAuthDomainMismatch.mockReturnValue({
      configuredAuthDomain: 'petroutine-2b8fd.firebaseapp.com',
      currentHost: 'petroutine-ielc.vercel.app',
      usesFirebaseHostedDomain: true,
    });

    render(<LoginPage />);

    const googleButton = await screen.findByRole('button', { name: 'Google로 시작하기' });
    fireEvent.click(googleButton);

    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });
});
