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
const mockSignInWithEmailAndPassword = vi.fn();
const mockSendPasswordResetEmail = vi.fn();

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(function MockGoogleAuthProvider(this: { setCustomParameters: typeof mockSetCustomParameters }) {
    this.setCustomParameters = mockSetCustomParameters;
  }),
  getRedirectResult: (...args: unknown[]) => mockGetRedirectResult(...args),
  signInWithRedirect: (...args: unknown[]) => mockSignInWithRedirect(...args),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...(args as [unknown, (user: null) => void])),
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
  signInWithCustomToken: vi.fn(),
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

// ============================================================
// next/link 모킹
// ============================================================
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
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
    type,
    className,
    variant,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: string;
    className?: string;
    variant?: string;
  }) =>
    React.createElement(
      'button',
      { disabled, onClick, type, className, 'data-variant': variant },
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
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    form: ({ children, initial, animate, transition, onSubmit, ...props }: { children?: React.ReactNode; onSubmit?: React.FormEventHandler; [key: string]: unknown }) =>
      React.createElement('form', { onSubmit, ...props }, children),
    p: ({ children, initial, animate, transition, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('p', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
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

  it('이메일/비밀번호 입력 필드가 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
    });
  });

  it('로그인 버튼이 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument());
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

  it('회원가입 링크가 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => {
      const signupLink = screen.getByRole('link', { name: '회원가입' });
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
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

  it('이메일/비밀번호 로그인 성공 시 홈으로 이동한다', async () => {
    const fakeUser = { getIdToken: vi.fn().mockResolvedValue('email-token') };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: fakeUser });

    render(<LoginPage />);
    await waitFor(() => screen.getByPlaceholderText('이메일'));

    fireEvent.change(screen.getByPlaceholderText('이메일'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('비밀번호'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123',
      );
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('이메일/비밀번호 로그인 실패 시 toast 에러를 표시한다', async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue(new Error('wrong-password'));

    render(<LoginPage />);
    await waitFor(() => screen.getByPlaceholderText('이메일'));

    fireEvent.change(screen.getByPlaceholderText('이메일'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('비밀번호'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('이메일 또는 비밀번호가 올바르지 않습니다.');
    });
  });

  it('비밀번호 찾기 링크 클릭 시 재설정 폼이 표시된다', async () => {
    render(<LoginPage />);
    await waitFor(() => screen.getByText('비밀번호를 잊으셨나요?'));

    fireEvent.click(screen.getByText('비밀번호를 잊으셨나요?'));

    await waitFor(() => {
      expect(screen.getByText('비밀번호 재설정')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('가입한 이메일 주소')).toBeInTheDocument();
    });
  });

  it('비밀번호 재설정 이메일 전송 성공 시 toast success를 표시한다', async () => {
    mockSendPasswordResetEmail.mockResolvedValue(undefined);

    render(<LoginPage />);
    await waitFor(() => screen.getByText('비밀번호를 잊으셨나요?'));

    fireEvent.click(screen.getByText('비밀번호를 잊으셨나요?'));
    await waitFor(() => screen.getByPlaceholderText('가입한 이메일 주소'));

    fireEvent.change(screen.getByPlaceholderText('가입한 이메일 주소'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '재설정 이메일 보내기' }));

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
      );
      expect(mockToastSuccess).toHaveBeenCalledWith('비밀번호 재설정 이메일을 보냈어요');
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
