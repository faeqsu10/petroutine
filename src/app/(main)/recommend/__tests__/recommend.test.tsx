import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    section: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    header: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('header', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

let mockPets: Array<{ id: string; species: 'dog' | 'cat' | 'other' }> = [];
let mockSelectedPetId: string | null = null;

vi.mock('@/hooks/use-pets', () => ({
  usePets: () => ({
    data: mockPets,
  }),
}));

vi.mock('@/stores/care-store', () => ({
  useCareStore: (selector: (state: { selectedPetId: string | null }) => unknown) =>
    selector({ selectedPetId: mockSelectedPetId }),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    open,
    children,
  }: {
    open?: boolean;
    children: React.ReactNode;
  }) => (open ? React.createElement('div', { 'data-testid': 'sheet-root' }, children) : null),
  SheetContent: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const cleanedProps = { ...props };
    delete cleanedProps.side;
    delete cleanedProps.showCloseButton;
    return React.createElement('div', cleanedProps, children);
  },
  SheetHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('div', props, children),
  SheetTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('h2', props, children),
  SheetDescription: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('p', props, children),
  SheetFooter: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('div', props, children),
}));

vi.mock('lucide-react', () => ({
  ExternalLink: () => React.createElement('span', { 'data-testid': 'icon-external' }),
  Star: () => React.createElement('span', { 'data-testid': 'icon-star' }),
}));

import RecommendPage from '../page';

describe('RecommendPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPets = [
      { id: 'pet-dog', species: 'dog' },
      { id: 'pet-cat', species: 'cat' },
    ];
    mockSelectedPetId = 'pet-cat';
  });

  it('큐레이션 상품 페이지가 렌더링된다', () => {
    render(<RecommendPage />);
    expect(screen.getByText('큐레이션 상품')).toBeInTheDocument();
    expect(screen.getByText('반려동물 종류와 카테고리 기준으로 정리한 상품을 둘러보세요')).toBeInTheDocument();
  });

  it('현재 펫 기준으로 기본 종 필터가 적용된다', () => {
    render(<RecommendPage />);

    expect(screen.getByText('오리젠 캣 & 키튼')).toBeInTheDocument();
    expect(screen.queryByText('로얄캐닌 미니 어덜트')).not.toBeInTheDocument();
  });

  it('종류와 카테고리 필터가 표시된다', () => {
    render(<RecommendPage />);

    const allButtons = screen.getAllByRole('button', { name: '전체' });
    expect(allButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: '강아지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '고양이' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🍖 사료' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🧴 위생' })).toBeInTheDocument();
  });

  it('강아지 필터 선택 시 강아지 상품과 공용 상품만 표시된다', () => {
    render(<RecommendPage />);
    fireEvent.click(screen.getByRole('button', { name: '강아지' }));

    expect(screen.getByText('로얄캐닌 미니 어덜트')).toBeInTheDocument();
    expect(screen.getByText('하림 강아지 간식 세트')).toBeInTheDocument();
    expect(screen.getByText('펫 자동 급수기')).toBeInTheDocument();
    expect(screen.queryByText('오리젠 캣 & 키튼')).not.toBeInTheDocument();
  });

  it('필터 결과 없을 때 안내 메시지가 표시된다', () => {
    render(<RecommendPage />);
    fireEvent.click(screen.getByRole('button', { name: '강아지' }));
    fireEvent.click(screen.getByRole('button', { name: '🧴 위생' }));

    expect(screen.getByText('해당 조건의 상품이 없어요')).toBeInTheDocument();
  });

  it('상품 카드를 누르면 상세 시트가 열린다', () => {
    render(<RecommendPage />);
    fireEvent.click(screen.getByText('오리젠 캣 & 키튼'));

    expect(screen.getByTestId('sheet-root')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '오리젠 캣 & 키튼' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /구매 링크 열기/i })).toBeInTheDocument();
  });

  it('링크가 있는 상품은 외부 이동 CTA를 보여준다', () => {
    render(<RecommendPage />);
    fireEvent.click(screen.getByText('오리젠 캣 & 키튼'));

    const link = screen.getByRole('link', { name: /구매 링크 열기/i });
    expect(link).toHaveAttribute('href', 'https://example.com/products/orijen-cat-kitten');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('링크가 없는 상품은 비활성 CTA를 보여준다', () => {
    render(<RecommendPage />);
    fireEvent.click(screen.getByText('고양이 스크래처 타워'));

    expect(screen.getByRole('button', { name: '링크 준비 중' })).toBeDisabled();
  });

  it('사용자가 필터를 바꾼 뒤에는 펫 기준이 바뀌어도 수동 선택을 유지한다', () => {
    const { rerender } = render(<RecommendPage />);

    fireEvent.click(screen.getAllByRole('button', { name: '전체' })[0]);
    expect(screen.getByText('로얄캐닌 미니 어덜트')).toBeInTheDocument();
    expect(screen.getByText('오리젠 캣 & 키튼')).toBeInTheDocument();

    mockSelectedPetId = 'pet-dog';
    rerender(<RecommendPage />);

    expect(screen.getByText('로얄캐닌 미니 어덜트')).toBeInTheDocument();
    expect(screen.getByText('오리젠 캣 & 키튼')).toBeInTheDocument();
  });
});
