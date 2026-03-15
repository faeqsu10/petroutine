import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, variants, whileHover, whileTap, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    section: ({ children, initial, animate, transition, variants, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    header: ({ children, initial, animate, transition, variants, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('header', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// next/navigation 모킹
// ============================================================
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: mockBack }),
  usePathname: () => '/settings/notifications',
}));

// ============================================================
// lucide-react 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  ChevronLeft: () => React.createElement('span', { 'data-testid': 'icon-chevron-left' }),
  Bell: () => React.createElement('span', { 'data-testid': 'icon-bell' }),
  BellOff: () => React.createElement('span', { 'data-testid': 'icon-bell-off' }),
  CheckCircle2: () => React.createElement('span', { 'data-testid': 'icon-check-circle' }),
}));

// ============================================================
// constants 모킹
// ============================================================
vi.mock('@/lib/constants', () => ({
  BOTTOM_NAV_PADDING: 'pb-32',
}));

// ============================================================
// firebase/firestore 모킹
// ============================================================
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
}));

// ============================================================
// firebase/client 모킹
// ============================================================
vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user' },
  },
}));

// ============================================================
// messaging 모킹
// ============================================================
vi.mock('@/lib/firebase/messaging', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue(undefined),
}));

// ============================================================
// useCareItems / useUpdateCareItem 모킹
// ============================================================
const mockCareItems = [
  { id: 'care-1', name: '목욕', icon: '🛁', notifyEnabled: true },
  { id: 'care-2', name: '양치', icon: '🦷', notifyEnabled: false },
];

const mockMutate = vi.fn();
vi.mock('@/hooks/use-care-items', () => ({
  useCareItems: vi.fn(() => ({ data: mockCareItems })),
  useUpdateCareItem: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import NotificationsPage from '../page';

// ============================================================
// 테스트
// ============================================================
describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Notification API 기본 모킹 (jsdom에서는 없음)
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default' },
      writable: true,
      configurable: true,
    });
  });

  it('알림 설정 페이지가 렌더링된다', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('알림 설정')).toBeInTheDocument();
  });

  it('전체 알림 토글이 표시된다', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('알림 받기')).toBeInTheDocument();
    expect(screen.getByText('모든 케어 알림 ON/OFF')).toBeInTheDocument();
    // role="switch"인 버튼이 존재해야 함 (전체 + 케어 항목별 토글)
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(1);
  });

  it('알림 시간 입력이 표시된다', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('알림 시간')).toBeInTheDocument();
    const timeInput = screen.getByDisplayValue('09:00');
    expect(timeInput).toBeInTheDocument();
    expect(timeInput).toHaveAttribute('type', 'time');
  });

  it('뒤로가기 버튼이 표시된다', () => {
    render(<NotificationsPage />);
    const backIcon = screen.getByTestId('icon-chevron-left');
    expect(backIcon).toBeInTheDocument();
    // 뒤로가기 버튼의 부모 button 확인
    const backButton = backIcon.closest('button');
    expect(backButton).toBeInTheDocument();
  });

  it('케어 항목별 토글이 표시된다', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('목욕')).toBeInTheDocument();
    expect(screen.getByText('양치')).toBeInTheDocument();
    expect(screen.getByText('케어 항목별 알림')).toBeInTheDocument();
    // 케어 항목별 switch가 2개 있어야 함 (전체 토글 제외)
    const switches = screen.getAllByRole('switch');
    // 전체 토글 1개 + 케어 항목 2개 = 3개
    expect(switches.length).toBe(3);
  });
});
