import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// next/link 모킹
// ============================================================
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}));

// ============================================================
// framer-motion 모킹
// ============================================================
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, whileHover, whileTap, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    section: ({ children, initial, animate, transition, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    button: ({ children, initial, animate, transition, whileHover, whileTap, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================
// lucide-react 아이콘 모킹
// ============================================================
vi.mock('lucide-react', () => ({
  Plus: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'Plus'),
  Check: ({ ...props }: Record<string, unknown>) => React.createElement('span', props, 'Check'),
}));

// ============================================================
// shadcn Button 모킹
// ============================================================
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    size?: string;
    [key: string]: unknown;
  }) => React.createElement('button', { onClick, className, ...props }, children),
}));

// ============================================================
// CompleteModal 모킹
// ============================================================
vi.mock('@/components/care/complete-modal', () => ({
  CompleteModal: () => null,
}));

// ============================================================
// CareEditSheet 모킹
// ============================================================
vi.mock('@/components/care/edit-sheet', () => ({
  CareEditSheet: () => null,
}));

// ============================================================
// 훅 모킹
// ============================================================
const mockUsePets = vi.fn();
const mockUseCareItems = vi.fn();
const mockUseCareStore = vi.fn();

vi.mock('@/hooks/use-pets', () => ({
  usePets: () => mockUsePets(),
}));

vi.mock('@/hooks/use-care-items', () => ({
  useCareItems: () => mockUseCareItems(),
}));

vi.mock('@/stores/care-store', () => ({
  useCareStore: (selector: (s: { selectedPetId: string | null; setSelectedPetId: (id: string | null) => void }) => unknown) =>
    mockUseCareStore(selector),
}));

// ============================================================
// 유틸 모킹
// ============================================================
vi.mock('@/lib/utils', () => ({
  getScheduleUrgency: vi.fn(() => 'pending'),
  getDdayText: vi.fn(() => 'D-3'),
  getUrgencyColor: vi.fn(() => '#888888'),
  formatDate: vi.fn(() => '2026-03-10'),
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import CarePage from '../page';

// ============================================================
// 픽스처
// ============================================================
const mockPet1 = { id: 'pet-1', name: '초코' };
const mockPet2 = { id: 'pet-2', name: '몽이' };

const mockCareItem = {
  id: 'care-1',
  name: '목욕',
  icon: '🛁',
  category: 'hygiene',
  schedule: { nextDueDate: '2026-03-17', status: 'pending' },
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
describe('CarePage (케어 관리)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCareStore.mockImplementation(
      (selector: (s: { selectedPetId: string | null; setSelectedPetId: (id: string | null) => void }) => unknown) =>
        selector({ selectedPetId: null, setSelectedPetId: vi.fn() }),
    );
  });

  // ─── 기본 렌더링 ──────────────────────────────────────────────
  describe('기본 렌더링', () => {
    it('케어 페이지가 렌더링된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [], isLoading: false });

      render(<CarePage />);

      expect(screen.getByText('케어 관리')).toBeInTheDocument();
    });

    it('케어 항목 추가 버튼이 표시된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [], isLoading: false });

      render(<CarePage />);

      expect(screen.getByText('추가')).toBeInTheDocument();
    });

    it('케어 항목 추가 버튼이 /care/add로 연결된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [], isLoading: false });

      render(<CarePage />);

      // 헤더의 항목 추가 링크만 확인 (빈 상태에서도 /care/add 링크가 존재함)
      const links = screen.getAllByRole('link');
      const careAddLinks = links.filter((l) => l.getAttribute('href') === '/care/add');
      expect(careAddLinks.length).toBeGreaterThan(0);
    });
  });

  // ─── 반려동물 선택 탭 ─────────────────────────────────────────
  describe('반려동물 선택 탭', () => {
    it('반려동물이 2마리 이상이면 선택 탭이 표시된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1, mockPet2] });
      mockUseCareItems.mockReturnValue({ data: [], isLoading: false });

      render(<CarePage />);

      expect(screen.getByRole('button', { name: '초코' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '몽이' })).toBeInTheDocument();
    });

    it('반려동물이 1마리이면 선택 탭이 표시되지 않는다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [], isLoading: false });

      render(<CarePage />);

      expect(screen.queryByRole('button', { name: '초코' })).not.toBeInTheDocument();
    });
  });

  // ─── 빈 상태 ──────────────────────────────────────────────────
  describe('빈 상태', () => {
    it('케어 항목이 없으면 빈 상태를 표시한다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [], isLoading: false });

      render(<CarePage />);

      expect(screen.getByText('등록된 케어 항목이 없어요')).toBeInTheDocument();
    });

    it('빈 상태에서 첫 케어 항목 추가 링크가 /care/add로 연결된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [], isLoading: false });

      render(<CarePage />);

      const links = screen.getAllByRole('link');
      const careAddLinks = links.filter((l) => l.getAttribute('href') === '/care/add');
      expect(careAddLinks.length).toBeGreaterThan(0);
    });
  });

  // ─── 케어 항목 목록 ───────────────────────────────────────────
  describe('케어 항목 목록', () => {
    it('케어 항목 목록이 표시된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [mockCareItem], isLoading: false });

      render(<CarePage />);

      expect(screen.getByText('목욕')).toBeInTheDocument();
    });

    it('카테고리 레이블이 표시된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: [mockCareItem], isLoading: false });

      render(<CarePage />);

      expect(screen.getByText('🧼 위생')).toBeInTheDocument();
    });

    it('로딩 중일 때 로딩 텍스트가 표시된다', () => {
      mockUsePets.mockReturnValue({ data: [mockPet1] });
      mockUseCareItems.mockReturnValue({ data: undefined, isLoading: true });

      render(<CarePage />);

      expect(screen.getByText('로딩 중…')).toBeInTheDocument();
    });
  });
});
