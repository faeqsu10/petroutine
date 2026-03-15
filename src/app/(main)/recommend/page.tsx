'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { BOTTOM_NAV_PADDING, PRODUCT_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Species = 'all' | 'dog' | 'cat';
type Category = keyof typeof PRODUCT_CATEGORIES;

interface Product {
  id: string;
  name: string;
  category: Category;
  species: 'dog' | 'cat' | 'all';
  price: number;
  image: null;
  description: string;
  rating: number;
}

const DUMMY_PRODUCTS: Product[] = [
  { id: '1', name: '로얄캐닌 미니 어덜트', category: 'food', species: 'dog', price: 45000, image: null, description: '소형견용 프리미엄 사료', rating: 4.8 },
  { id: '2', name: '오리젠 캣 & 키튼', category: 'food', species: 'cat', price: 52000, image: null, description: '고양이용 그레인프리 사료', rating: 4.9 },
  { id: '3', name: '하림 강아지 간식 세트', category: 'treat', species: 'dog', price: 12000, image: null, description: '국내산 닭가슴살 간식', rating: 4.5 },
  { id: '4', name: '츄르 참치맛 20개입', category: 'treat', species: 'cat', price: 15000, image: null, description: '고양이가 좋아하는 액상 간식', rating: 4.7 },
  { id: '5', name: '펫 자동 급수기', category: 'supply', species: 'all', price: 25000, image: null, description: '2L 자동 순환 급수기', rating: 4.6 },
  { id: '6', name: '고양이 스크래처 타워', category: 'supply', species: 'cat', price: 35000, image: null, description: '다단 캣타워 겸 스크래처', rating: 4.4 },
  { id: '7', name: '강아지 샴푸 저자극', category: 'hygiene', species: 'dog', price: 18000, image: null, description: '민감한 피부용 천연 샴푸', rating: 4.3 },
  { id: '8', name: '펫 물티슈 80매', category: 'hygiene', species: 'all', price: 5000, image: null, description: '무향 저자극 물티슈', rating: 4.6 },
];

const SPECIES_TABS: { value: Species; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'dog', label: '강아지' },
  { value: 'cat', label: '고양이' },
];

const CATEGORY_TABS: { value: Category; label: string }[] = (
  Object.entries(PRODUCT_CATEGORIES) as [Category, string][]
).map(([value, label]) => ({ value, label }));

function formatPrice(price: number): string {
  return `₩${price.toLocaleString('ko-KR')}`;
}

export default function RecommendPage() {
  const [speciesFilter, setSpeciesFilter] = useState<Species>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);

  const filtered = DUMMY_PRODUCTS.filter((p) => {
    const speciesMatch = speciesFilter === 'all' || p.species === 'all' || p.species === speciesFilter;
    const categoryMatch = categoryFilter === null || p.category === categoryFilter;
    return speciesMatch && categoryMatch;
  });

  return (
    <div className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground/90">추천 상품</h1>
        <p className="text-sm text-muted-foreground">우리 아이를 위한 엄선된 상품을 만나보세요</p>
      </header>

      {/* 반려동물 종류 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPECIES_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSpeciesFilter(value)}
            className={cn(
              'shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all',
              speciesFilter === value
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter(null)}
          className={cn(
            'shrink-0 rounded-2xl px-4 py-2 text-xs font-bold transition-all',
            categoryFilter === null
              ? 'bg-foreground text-background shadow'
              : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
          )}
        >
          전체
        </button>
        {CATEGORY_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategoryFilter(value)}
            className={cn(
              'shrink-0 rounded-2xl px-4 py-2 text-xs font-bold transition-all',
              categoryFilter === value
                ? 'bg-foreground text-background shadow'
                : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 상품 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="bento-item flex flex-col items-center gap-2 bg-card/40 glass py-12 text-center">
          <p className="text-3xl opacity-20">🛍️</p>
          <p className="text-sm font-medium text-muted-foreground">해당 조건의 상품이 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => toast.info('제휴 연동 준비 중이에요')}
              className="bento-item flex flex-col gap-3 bg-card/40 glass p-4 text-left transition-all hover:bg-card/60 active:scale-[0.98]"
            >
              {/* 이미지 플레이스홀더 */}
              <div className="flex h-20 w-full items-center justify-center rounded-xl bg-secondary text-3xl">
                {PRODUCT_CATEGORIES[product.category].split(' ')[0]}
              </div>

              {/* 준비 중 배지 */}
              <span className="self-start rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                준비 중
              </span>

              {/* 상품 정보 */}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-black leading-snug text-foreground/90 line-clamp-2">
                  {product.name}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{product.description}</p>
              </div>

              {/* 별점 + 가격 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-[11px] font-bold text-foreground/70">{product.rating}</span>
                </div>
                <span className="text-xs font-black text-primary">{formatPrice(product.price)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
