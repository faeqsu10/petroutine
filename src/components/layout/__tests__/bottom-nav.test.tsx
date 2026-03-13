import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// 외부 의존성 모킹 — vi.mock은 호이스팅됨
// ============================================================
const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: { div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} /> },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 이후)
// ============================================================
import { BottomNav } from '@/components/layout/bottom-nav';

// ============================================================
// 테스트
// ============================================================
describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  // ─── 렌더링 ─────────────────────────────────────────────────
  describe('렌더링', () => {
    it('4개의 네비게이션 항목(홈, 케어, 가계부, 설정)을 렌더링한다', () => {
      render(<BottomNav />);
      expect(screen.getByText('홈')).toBeInTheDocument();
      expect(screen.getByText('케어')).toBeInTheDocument();
      expect(screen.getByText('가계부')).toBeInTheDocument();
      expect(screen.getByText('설정')).toBeInTheDocument();
    });

    it('각 항목이 올바른 href를 가진다', () => {
      render(<BottomNav />);
      expect(screen.getByText('홈').closest('a')).toHaveAttribute('href', '/');
      expect(screen.getByText('케어').closest('a')).toHaveAttribute('href', '/care');
      expect(screen.getByText('가계부').closest('a')).toHaveAttribute('href', '/expenses');
      expect(screen.getByText('설정').closest('a')).toHaveAttribute('href', '/settings');
    });
  });

  // ─── 활성 탭 ────────────────────────────────────────────────
  describe('활성 탭', () => {
    it('현재 경로에 해당하는 항목이 활성화된다 (홈)', () => {
      mockUsePathname.mockReturnValue('/');
      render(<BottomNav />);

      const homeLink = screen.getByText('홈').closest('a');
      expect(homeLink?.className).toContain('text-primary');
    });

    it('/care 경로에서 케어 탭이 활성화된다', () => {
      mockUsePathname.mockReturnValue('/care');
      render(<BottomNav />);

      const careLink = screen.getByText('케어').closest('a');
      expect(careLink?.className).toContain('text-primary');
    });

    it('/expenses 경로에서 가계부 탭이 활성화된다', () => {
      mockUsePathname.mockReturnValue('/expenses');
      render(<BottomNav />);

      const expensesLink = screen.getByText('가계부').closest('a');
      expect(expensesLink?.className).toContain('text-primary');
    });

    it('활성화되지 않은 항목은 text-primary 클래스를 가지지 않는다', () => {
      mockUsePathname.mockReturnValue('/');
      render(<BottomNav />);

      const careLink = screen.getByText('케어').closest('a');
      expect(careLink?.className).not.toContain('text-primary');
    });
  });
});
