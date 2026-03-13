import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// next/image 모킹 — jsdom은 SVG/Image 로딩을 지원하지 않으므로
// 단순한 <img> 태그로 대체한다.
// ============================================================
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement('img', { src, alt, ...props }),
}));

// ============================================================
// next/link 모킹 — href를 그대로 렌더링하는 <a> 태그로 대체한다.
// ============================================================
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement('a', { href }, children),
}));

// ============================================================
// shadcn Button 모킹 — 실제 Radix 의존성 없이 단순 button으로 대체한다.
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => React.createElement('button', { className }, children),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 등록 이후)
// ============================================================
import WelcomePage from '../page';

// ============================================================
// 테스트
// ============================================================
describe('WelcomePage', () => {
  // ─── 히어로 섹션 ──────────────────────────────────────────
  describe('히어로 섹션', () => {
    it('히어로 섹션의 "기억에 의존하지 않는" 텍스트가 렌더링된다', () => {
      render(<WelcomePage />);
      expect(screen.getByText('기억에 의존하지 않는')).toBeInTheDocument();
    });

    it('"반려동물 관리" 텍스트가 렌더링된다', () => {
      render(<WelcomePage />);
      expect(screen.getByText('반려동물 관리')).toBeInTheDocument();
    });

    it('alt="Petroutine"인 로고 이미지가 렌더링된다', () => {
      render(<WelcomePage />);
      expect(screen.getByRole('img', { name: 'Petroutine' })).toBeInTheDocument();
    });
  });

  // ─── 기능 카드 섹션 ───────────────────────────────────────
  describe('기능 카드 섹션', () => {
    it('"알림 한 번이면 끝" 카드가 렌더링된다', () => {
      render(<WelcomePage />);
      expect(screen.getByText('알림 한 번이면 끝')).toBeInTheDocument();
    });

    it('"지출도 한눈에" 카드가 렌더링된다', () => {
      render(<WelcomePage />);
      expect(screen.getByText('지출도 한눈에')).toBeInTheDocument();
    });

    it('"여러 아이도 OK" 카드가 렌더링된다', () => {
      render(<WelcomePage />);
      expect(screen.getByText('여러 아이도 OK')).toBeInTheDocument();
    });

    it('3개의 기능 카드가 모두 렌더링된다', () => {
      render(<WelcomePage />);
      // 각 카드의 타이틀이 모두 존재하는지 확인
      expect(screen.getByText('알림 한 번이면 끝')).toBeInTheDocument();
      expect(screen.getByText('지출도 한눈에')).toBeInTheDocument();
      expect(screen.getByText('여러 아이도 OK')).toBeInTheDocument();
    });
  });

  // ─── CTA 섹션 ─────────────────────────────────────────────
  describe('CTA 섹션', () => {
    it('"시작하기" 버튼이 /login으로 링크된다', () => {
      render(<WelcomePage />);
      const link = screen.getByRole('link', { name: '시작하기' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/login');
    });

    it('"Google 계정으로 간편하게 시작할 수 있어요" 텍스트가 렌더링된다', () => {
      render(<WelcomePage />);
      expect(
        screen.getByText('Google 계정으로 간편하게 시작할 수 있어요'),
      ).toBeInTheDocument();
    });
  });
});
