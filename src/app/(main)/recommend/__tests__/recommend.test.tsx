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
const defaultMockProducts = [
  {
    id: 'dog-food-royal-canin',
    name: '로얄캐닌 미니 어덜트',
    category: 'food',
    species: 'dog',
    price: 45000,
    imageUrl: null,
    description: '소형견이 먹기 편한 알갱이와 균형 잡힌 영양 설계를 가진 기본 사료예요.',
    rating: 4.8,
    affiliateUrl: 'https://example.com/products/royal-canin-mini-adult',
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'cat-food-orijen',
    name: '오리젠 캣 & 키튼',
    category: 'food',
    species: 'cat',
    price: 52000,
    imageUrl: null,
    description: '고단백 레시피 중심으로 고양이와 키튼에게 맞춘 프리미엄 건사료예요.',
    rating: 4.9,
    affiliateUrl: 'https://example.com/products/orijen-cat-kitten',
    isActive: true,
    sortOrder: 20,
  },
  {
    id: 'dog-treat-harim',
    name: '하림 강아지 간식 세트',
    category: 'treat',
    species: 'dog',
    price: 12000,
    imageUrl: null,
    description: '한입 크기 단백질 간식 위주로 구성한 기본 간식 세트예요.',
    rating: 4.5,
    affiliateUrl: null,
    isActive: true,
    sortOrder: 30,
  },
  {
    id: 'cat-treat-churu',
    name: '츄르 참치맛 20개입',
    category: 'treat',
    species: 'cat',
    price: 15000,
    imageUrl: null,
    description: '급여가 쉽고 기호성이 높은 액상형 간식이에요.',
    rating: 4.7,
    affiliateUrl: null,
    isActive: true,
    sortOrder: 40,
  },
  {
    id: 'all-supply-water-fountain',
    name: '펫 자동 급수기',
    category: 'supply',
    species: 'all',
    price: 25000,
    imageUrl: null,
    description: '공용으로 쓰기 좋은 기본 급수기예요. 물 순환 구조라 첫 입문용으로 무난해요.',
    rating: 4.6,
    affiliateUrl: 'https://example.com/products/pet-water-fountain',
    isActive: true,
    sortOrder: 50,
  },
  {
    id: 'cat-supply-scratcher',
    name: '고양이 스크래처 타워',
    category: 'supply',
    species: 'cat',
    price: 35000,
    imageUrl: null,
    description: '스크래처와 숨숨집 역할을 같이 하는 다단형 타워예요.',
    rating: 4.4,
    affiliateUrl: null,
    isActive: true,
    sortOrder: 60,
  },
  {
    id: 'cat-hygiene-wipes',
    name: '고양이 저자극 물티슈',
    category: 'hygiene',
    species: 'cat',
    price: 9000,
    imageUrl: null,
    description: '얼굴과 발 주변을 가볍게 닦기 좋은 저자극 위생 티슈예요.',
    rating: 4.3,
    affiliateUrl: null,
    isActive: true,
    sortOrder: 70,
  },
];
let mockProducts = [...defaultMockProducts];
let mockProductsLoading = false;
let mockProductsError = false;

const {
  mockUsePets,
  mockUseCareStore,
  mockUseCuratedProducts,
  mockLogClientRecommendationEvent,
} = vi.hoisted(() => ({
  mockUsePets: vi.fn(),
  mockUseCareStore: vi.fn(),
  mockUseCuratedProducts: vi.fn(),
  mockLogClientRecommendationEvent: vi.fn(),
}));

vi.mock('@/hooks/use-pets', () => ({
  usePets: (...args: unknown[]) => mockUsePets(...args),
}));

vi.mock('@/hooks/use-curated-products', () => ({
  useCuratedProducts: (...args: unknown[]) => mockUseCuratedProducts(...args),
}));

vi.mock('@/lib/client-recommendation-logger', () => ({
  logClientRecommendationEvent: (...args: unknown[]) => mockLogClientRecommendationEvent(...args),
}));

vi.mock('@/stores/care-store', () => ({
  useCareStore: (...args: unknown[]) => mockUseCareStore(...args),
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
    mockProducts = [...defaultMockProducts];
    mockProductsLoading = false;
    mockProductsError = false;

    mockUsePets.mockReturnValue({ data: mockPets });
    mockUseCareStore.mockImplementation(
      (selector: (state: { selectedPetId: string | null }) => unknown) =>
        selector({ selectedPetId: mockSelectedPetId }),
    );
    mockUseCuratedProducts.mockImplementation(() => ({
      data: mockProducts,
      isLoading: mockProductsLoading,
      isError: mockProductsError,
    }));
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

  it('상품 목록 로딩 중에는 스켈레톤을 보여준다', () => {
    mockProductsLoading = true;

    render(<RecommendPage />);

    expect(screen.getByText('큐레이션 상품')).toBeInTheDocument();
    expect(screen.queryByText('오리젠 캣 & 키튼')).not.toBeInTheDocument();
  });

  it('상품 목록 조회 실패 시 에러 상태를 보여준다', () => {
    mockProductsError = true;

    render(<RecommendPage />);

    expect(screen.getByText('상품 목록을 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도하기' })).toBeInTheDocument();
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

  it('카탈로그 자체가 비어 있으면 전용 빈 상태를 보여준다', () => {
    mockProducts = [];

    render(<RecommendPage />);

    expect(screen.getByText('아직 등록된 큐레이션 상품이 없어요')).toBeInTheDocument();
  });

  it('상품 카드를 누르면 상세 시트가 열린다', () => {
    render(<RecommendPage />);
    fireEvent.click(screen.getByText('오리젠 캣 & 키튼'));

    expect(screen.getByTestId('sheet-root')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '오리젠 캣 & 키튼' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /구매 링크 열기/i })).toBeInTheDocument();
    expect(mockLogClientRecommendationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'open_detail',
        productId: 'cat-food-orijen',
        currentSpeciesFilter: 'cat',
      }),
    );
  });

  it('링크가 있는 상품은 외부 이동 CTA를 보여준다', () => {
    render(<RecommendPage />);
    fireEvent.click(screen.getByText('오리젠 캣 & 키튼'));

    const link = screen.getByRole('link', { name: /구매 링크 열기/i });
    expect(link).toHaveAttribute('href', 'https://example.com/products/orijen-cat-kitten');
    expect(link).toHaveAttribute('target', '_blank');
    fireEvent.click(link);
    expect(mockLogClientRecommendationEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        eventType: 'click_cta',
        productId: 'cat-food-orijen',
      }),
    );
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
