import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ============================================================
// next/navigation 모킹
// ============================================================
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/onboarding',
  useSearchParams: () => new URLSearchParams(),
}));

// ============================================================
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// Firebase 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}));

// ============================================================
// sonner 모킹
// ============================================================
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// ============================================================
// 유틸 모킹
// ============================================================
vi.mock('@/lib/utils', () => ({
  calculateNextDueDate: vi.fn(() => new Date()),
  toLocalDateStr: vi.fn(() => '2026-03-15'),
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================
// shadcn 컴포넌트 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => React.createElement('button', { onClick, disabled, className }, children),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    React.createElement('input', props),
}));

// ============================================================
// 훅 모킹
// ============================================================
const mockUsePets = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue({ id: 'new-pet-id' });
const mockUseCreatePet = vi.fn();

vi.mock('@/hooks/use-pets', () => ({
  usePets: () => mockUsePets(),
  useCreatePet: () => mockUseCreatePet(),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 이후)
// ============================================================
import OnboardingPage from '../page';

// ============================================================
// 테스트
// ============================================================
describe('OnboardingPage (온보딩)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePets.mockReturnValue({ data: [], isLoading: false });
    mockUseCreatePet.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  // ─── Step 1: 환영 ──────────────────────────────────────────
  describe('Step 1: 환영 화면', () => {
    it('환영 메시지가 표시된다', () => {
      render(<OnboardingPage />);
      expect(screen.getByText('반가워요!')).toBeInTheDocument();
    });

    it('"시작하기" 버튼이 표시된다', () => {
      render(<OnboardingPage />);
      expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument();
    });
  });

  // ─── Step 2: 반려동물 정보 ──────────────────────────────────
  describe('Step 2: 반려동물 정보 입력', () => {
    async function goToStep2() {
      const user = userEvent.setup();
      render(<OnboardingPage />);
      await user.click(screen.getByRole('button', { name: '시작하기' }));
    }

    it('이름 입력 필드가 표시된다', async () => {
      await goToStep2();
      expect(screen.getByPlaceholderText('예: 초코, 나비')).toBeInTheDocument();
    });

    it('종류 선택(강아지/고양이/기타)이 표시된다', async () => {
      await goToStep2();
      expect(screen.getByRole('button', { name: '🐶 강아지' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🐱 고양이' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🐾 기타' })).toBeInTheDocument();
    });
  });

  // ─── Step 3: 케어 템플릿 ────────────────────────────────────
  describe('Step 3: 케어 루틴 선택', () => {
    async function goToStep3() {
      const user = userEvent.setup();
      render(<OnboardingPage />);
      await user.click(screen.getByRole('button', { name: '시작하기' }));
      const input = screen.getByPlaceholderText('예: 초코, 나비');
      await user.type(input, '초코');
      await user.click(screen.getByRole('button', { name: '다음' }));
    }

    it('케어 템플릿 목록이 표시된다', async () => {
      await goToStep3();
      // CARE_TEMPLATES 중 hygiene 카테고리의 '목욕'이 표시되어야 함
      expect(screen.getByText('목욕')).toBeInTheDocument();
    });
  });

  // ─── 리다이렉트 ─────────────────────────────────────────────
  describe('리다이렉트', () => {
    it('이미 반려동물이 있으면 홈으로 리다이렉트된다', () => {
      mockUsePets.mockReturnValue({
        data: [{ id: 'pet-1', name: '초코' }],
        isLoading: false,
      });
      render(<OnboardingPage />);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
