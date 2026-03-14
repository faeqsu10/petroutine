import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// next/navigation 모킹
// ============================================================
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ============================================================
// next/link 모킹
// ============================================================
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
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
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('button', props, children),
    section: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// lucide-react 아이콘 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  Plus: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'Plus'),
  Bell: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'Bell'),
  ChevronRight: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'ChevronRight'),
  TrendingUp: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'TrendingUp'),
  Sparkles: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'Sparkles'),
}));

// ============================================================
// shadcn Button 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    [key: string]: unknown;
  }) => React.createElement('button', { onClick, className, disabled, ...props }, children),
}));

// ============================================================
// CompleteModal 모킹
// ============================================================
vi.mock('@/components/care/complete-modal', () => ({
  CompleteModal: () => null,
}));

// ============================================================
// 훅 모킹
// ============================================================
const mockUsePets = vi.fn();
const mockUseCareItems = vi.fn();
const mockUseCareStore = vi.fn();
const mockUseMonthlyStats = vi.fn();

vi.mock('@/hooks/use-pets', () => ({
  usePets: () => mockUsePets(),
}));

vi.mock('@/hooks/use-care-items', () => ({
  useCareItems: () => mockUseCareItems(),
}));

vi.mock('@/hooks/use-expenses', () => ({
  useMonthlyStats: () => mockUseMonthlyStats(),
}));

vi.mock('@/stores/care-store', () => ({
  useCareStore: (selector: (s: { selectedPetId: string | null; setSelectedPetId: (id: string | null) => void }) => unknown) =>
    mockUseCareStore(selector),
}));

// ============================================================
// 유틸 모킹 — vi.fn()으로 교체 가능하도록 설정
// ============================================================
const mockGetScheduleUrgency = vi.fn(() => 'pending');
const mockGetDdayText = vi.fn(() => 'D-3');
const mockGetUrgencyColor = vi.fn(() => '#888888');

vi.mock('@/lib/utils', () => ({
  getScheduleUrgency: (...args: unknown[]) => mockGetScheduleUrgency(...args),
  getDdayText: (...args: unknown[]) => mockGetDdayText(...args),
  getUrgencyColor: (...args: unknown[]) => mockGetUrgencyColor(...args),
  formatCurrency: (n: number) => `₩${n.toLocaleString()}`,
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 이후)
// ============================================================
import HomePage from '../page';

// ============================================================
// 픽스처
// ============================================================
const mockPet = { id: 'pet-1', name: '초코' };

const mockCareItemDue = {
  id: 'care-1',
  name: '목욕',
  icon: '🛁',
  category: 'hygiene',
  schedule: { nextDueDate: '2026-03-14', status: 'due' },
  lastLog: null,
  cycleValue: 7,
  cycleUnit: 'day',
  isActive: true,
  notifyEnabled: true,
  color: '#6366F1',
};

// ============================================================
// 테스트
// ============================================================
describe('HomePage (대시보드)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetScheduleUrgency.mockReturnValue('pending');

    mockUseCareStore.mockImplementation(
      (selector: (s: { selectedPetId: string | null; setSelectedPetId: (id: string | null) => void }) => unknown) =>
        selector({ selectedPetId: null, setSelectedPetId: vi.fn() }),
    );

    mockUseMonthlyStats.mockReturnValue({ data: { month: '2026-03', totalAmount: 0, byCategory: [], byPet: [] } });
  });

  // ─── 로딩 상태 ──────────────────────────────────────────────
  describe('로딩 상태', () => {
    it('로딩 중일 때 로딩 표시를 렌더링한다', () => {
      mockUsePets.mockReturnValue({ data: undefined, isLoading: true });
      mockUseCareItems.mockReturnValue({ data: undefined });

      render(<HomePage />);

      // 로딩 중이면 메인 콘텐츠가 렌더링되지 않는다
      expect(screen.queryByText('아이를 처음 만났나요?')).not.toBeInTheDocument();
      expect(screen.queryByText('오늘 할 일')).not.toBeInTheDocument();
    });
  });

  // ─── 반려동물 없음 ───────────────────────────────────────────
  describe('반려동물 없음 상태', () => {
    beforeEach(() => {
      mockUsePets.mockReturnValue({ data: [], isLoading: false });
      mockUseCareItems.mockReturnValue({ data: [] });
    });

    it('반려동물이 없으면 등록 안내를 표시한다', () => {
      render(<HomePage />);
      expect(screen.getByText('아이를 처음 만났나요?')).toBeInTheDocument();
    });

    it('반려동물 등록하기 버튼이 /pets/add로 연결된다', () => {
      render(<HomePage />);
      const link = screen.getByRole('link', { name: '반려동물 등록하기' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/pets/add');
    });
  });

  // ─── 반려동물 있음 ───────────────────────────────────────────
  describe('반려동물 있음 상태', () => {
    beforeEach(() => {
      mockUsePets.mockReturnValue({ data: [mockPet], isLoading: false });
      mockUseCareItems.mockReturnValue({ data: [] });
    });

    it('반려동물 미선택 시 기본 인사말이 표시된다', () => {
      render(<HomePage />);
      expect(screen.getByText(/보호자님/)).toBeInTheDocument();
    });

    it('오늘 할 일 섹션이 표시된다', () => {
      render(<HomePage />);
      expect(screen.getByText('오늘 할 일')).toBeInTheDocument();
    });
  });

  // ─── 케어 항목 ────────────────────────────────────────────────
  describe('케어 항목 표시', () => {
    it('케어 항목이 없으면 빈 상태 메시지를 표시한다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet], isLoading: false });
      mockUseCareItems.mockReturnValue({ data: [] });

      render(<HomePage />);

      expect(screen.getByText('완벽한 하루예요!')).toBeInTheDocument();
    });

    it('오늘의 케어 항목(due/overdue)이 표시된다', () => {
      // schedule.nextDueDate === '2026-03-14' 일 때 'due' 반환
      mockGetScheduleUrgency.mockImplementation((date: string) => {
        if (date === '2026-03-14') return 'due';
        return 'pending';
      });

      mockUsePets.mockReturnValue({ data: [mockPet], isLoading: false });
      mockUseCareItems.mockReturnValue({ data: [mockCareItemDue] });

      render(<HomePage />);

      expect(screen.getByText('목욕')).toBeInTheDocument();
    });
  });
});
