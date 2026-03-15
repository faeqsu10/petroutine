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

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

const mockCreateUserWithEmailAndPassword = vi.fn();
const mockUpdateProfile = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ============================================================
// next/link 모킹
// ============================================================
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

// ============================================================
// sonner 모킹
// ============================================================
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
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: string;
    className?: string;
  }) =>
    React.createElement(
      'button',
      { disabled, onClick, type, className },
      children,
    ),
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
import SignupPage from '../page';

// ============================================================
// 헬퍼
// ============================================================
function fillForm(overrides: Partial<{ name: string; email: string; password: string; confirm: string }> = {}) {
  const { name = '홍길동', email = 'test@example.com', password = 'password123', confirm = 'password123' } = overrides;
  fireEvent.change(screen.getByPlaceholderText('이름'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('이메일'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호 (6자 이상)'), { target: { value: password } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호 확인'), { target: { value: confirm } });
}

// ============================================================
// 테스트
// ============================================================
describe('SignupPage', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
  });

  it('회원가입 페이지가 렌더링된다', () => {
    render(<SignupPage />);
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
  });

  it('입력 필드 4개가 표시된다', () => {
    render(<SignupPage />);
    expect(screen.getByPlaceholderText('이름')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호 (6자 이상)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호 확인')).toBeInTheDocument();
  });

  it('회원가입 버튼이 표시된다', () => {
    render(<SignupPage />);
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
  });

  it('로그인 링크가 표시된다', () => {
    render(<SignupPage />);
    const loginLink = screen.getByRole('link', { name: '로그인' });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('회원가입 성공 시 홈으로 이동한다', async () => {
    const fakeUser = {
      getIdToken: vi.fn().mockResolvedValue('signup-token'),
      displayName: '홍길동',
      email: 'test@example.com',
      photoURL: null,
      uid: 'uid-123',
    };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: fakeUser });

    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123',
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(fakeUser, { displayName: '홍길동' });
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('비밀번호 불일치 시 에러 메시지를 표시한다', async () => {
    render(<SignupPage />);
    fillForm({ confirm: 'different123' });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument();
    });
    expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('비밀번호 6자 미만 시 에러 메시지를 표시한다', async () => {
    render(<SignupPage />);
    fillForm({ password: '123', confirm: '123' });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 6자 이상이어야 합니다')).toBeInTheDocument();
    });
    expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('이미 사용 중인 이메일이면 toast 에러를 표시한다', async () => {
    const error = Object.assign(new Error('email-in-use'), { code: 'auth/email-already-in-use' });
    mockCreateUserWithEmailAndPassword.mockRejectedValue(error);

    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('이미 사용 중인 이메일입니다.');
    });
  });

  it('기타 가입 오류 시 일반 toast 에러를 표시한다', async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error('unknown error'));

    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('회원가입에 실패했습니다. 다시 시도해주세요.');
    });
  });
});
