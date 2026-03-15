import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

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
// @tanstack/react-query — 실제 모듈 사용 (QueryClient는 생성자이므로 모킹 불필요)
// ============================================================

// ============================================================
// Toaster(sonner) 모킹
// ============================================================
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => React.createElement('div', { 'data-testid': 'toaster' }),
}));

// ============================================================
// next-themes 모킹 (Toaster가 useTheme 사용)
// ============================================================
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 이후)
// ============================================================
import { Providers } from '../providers';

// ============================================================
// 테스트
// ============================================================
describe('Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auth 초기화 전 로딩 스피너가 표시된다', () => {
    // onAuthStateChanged가 콜백을 즉시 호출하지 않음 → authReady = false
    mockOnAuthStateChanged.mockImplementation(() => vi.fn());

    render(
      <Providers>
        <div>children content</div>
      </Providers>,
    );

    // 스피너는 animate-spin 클래스를 가진 요소로 확인
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText('children content')).not.toBeInTheDocument();
  });

  it('auth 초기화 후 children이 렌더링된다', async () => {
    // onAuthStateChanged가 즉시 콜백 호출 → authReady = true
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return vi.fn();
      },
    );

    render(
      <Providers>
        <div>children content</div>
      </Providers>,
    );

    await waitFor(() => {
      expect(screen.getByText('children content')).toBeInTheDocument();
    });
  });

  it('Toaster가 렌더링된다', async () => {
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return vi.fn();
      },
    );

    render(
      <Providers>
        <div>children content</div>
      </Providers>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });
});
