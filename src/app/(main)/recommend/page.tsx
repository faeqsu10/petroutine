'use client';

import { useState } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { usePets } from '@/hooks/use-pets';
import { useCuratedProducts } from '@/hooks/use-curated-products';
import { useCareStore } from '@/stores/care-store';
import { BOTTOM_NAV_PADDING, PRODUCT_CATEGORIES } from '@/lib/constants';
import {
  getDefaultRecommendationSpecies,
  getProductCategoryMeta,
  getSpeciesLabel,
  type CuratedProduct,
  type RecommendationSpeciesFilter,
} from '@/lib/curated-products';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

type Category = keyof typeof PRODUCT_CATEGORIES;

const SPECIES_TABS: { value: RecommendationSpeciesFilter; label: string }[] = [
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
  const { data: pets } = usePets();
  const {
    data: curatedProducts,
    isLoading: productsLoading,
    isError: productsError,
  } = useCuratedProducts();
  const selectedPetId = useCareStore((state) => state.selectedPetId);
  const [speciesFilterOverride, setSpeciesFilterOverride] = useState<RecommendationSpeciesFilter | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CuratedProduct | null>(null);

  const defaultSpeciesFilter = getDefaultRecommendationSpecies(pets, selectedPetId);
  const speciesFilter = speciesFilterOverride ?? defaultSpeciesFilter;

  if (productsLoading) {
    return (
      <div className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground/90">큐레이션 상품</h1>
          <p className="text-sm text-muted-foreground">
            반려동물 종류와 카테고리 기준으로 정리한 상품을 둘러보세요
          </p>
        </header>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bento-item h-48 animate-pulse bg-card/40 glass"
            />
          ))}
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className={`space-y-6 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground/90">큐레이션 상품</h1>
          <p className="text-sm text-muted-foreground">
            반려동물 종류와 카테고리 기준으로 정리한 상품을 둘러보세요
          </p>
        </header>
        <div className="bento-item flex flex-col items-center gap-3 bg-card/40 glass py-12 text-center">
          <p className="text-sm font-medium text-destructive">상품 목록을 불러오지 못했어요</p>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => window.location.reload()}
          >
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  const products = curatedProducts ?? [];
  const filtered = products.filter((product) => {
    const speciesMatch =
      speciesFilter === 'all' || product.species === 'all' || product.species === speciesFilter;
    const categoryMatch = categoryFilter === null || product.category === categoryFilter;
    return speciesMatch && categoryMatch;
  });

  return (
    <div className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground/90">큐레이션 상품</h1>
        <p className="text-sm text-muted-foreground">
          반려동물 종류와 카테고리 기준으로 정리한 상품을 둘러보세요
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPECIES_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSpeciesFilterOverride(value)}
            className={cn(
              'shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all',
              speciesFilter === value
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-card/40 text-muted-foreground glass hover:bg-card/60',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter(null)}
          className={cn(
            'shrink-0 rounded-2xl px-4 py-2 text-xs font-bold transition-all',
            categoryFilter === null
              ? 'bg-foreground text-background shadow'
              : 'bg-card/40 text-muted-foreground glass hover:bg-card/60',
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
                : 'bg-card/40 text-muted-foreground glass hover:bg-card/60',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-muted-foreground">
        현재 기준: {speciesFilter === 'all' ? '전체 반려동물' : getSpeciesLabel(speciesFilter)}
      </p>

      {products.length === 0 ? (
        <div className="bento-item flex flex-col items-center gap-2 bg-card/40 glass py-12 text-center">
          <p className="text-3xl opacity-20">🛍️</p>
          <p className="text-sm font-medium text-muted-foreground">아직 등록된 큐레이션 상품이 없어요</p>
        </div>
      ) : filtered.length === 0 ? (
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
              onClick={() => setSelectedProduct(product)}
              className="bento-item flex flex-col gap-3 bg-card/40 glass p-4 text-left transition-all hover:bg-card/60 active:scale-[0.98]"
            >
              <div className="flex h-20 w-full items-center justify-center rounded-xl bg-secondary text-3xl">
                {getProductCategoryMeta(product.category).emoji}
              </div>

              <span
                className={cn(
                  'self-start rounded-full px-2 py-0.5 text-[10px] font-bold',
                  product.affiliateUrl
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {product.affiliateUrl ? '링크 제공' : '링크 준비 중'}
              </span>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-black leading-snug text-foreground/90 line-clamp-2">
                  {product.name}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{product.description}</p>
              </div>

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

      <Sheet open={Boolean(selectedProduct)} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        {selectedProduct && (
          <SheetContent side="bottom" className="rounded-t-3xl border-none px-0 pb-0 pt-0" showCloseButton={false}>
            <SheetHeader className="gap-4 border-b border-border/60 px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                    {getProductCategoryMeta(selectedProduct.category).label}
                  </span>
                  <SheetTitle className="text-lg font-black tracking-tight">
                    {selectedProduct.name}
                  </SheetTitle>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl">
                  {getProductCategoryMeta(selectedProduct.category).emoji}
                </div>
              </div>
              <SheetDescription className="text-sm leading-relaxed">
                {selectedProduct.description}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-card/50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    대상
                  </p>
                  <p className="mt-2 text-sm font-bold text-foreground/90">
                    {getSpeciesLabel(selectedProduct.species)}
                  </p>
                </div>
                <div className="rounded-2xl bg-card/50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    가격
                  </p>
                  <p className="mt-2 text-sm font-black text-primary">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-card/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  평점
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-foreground/80">{selectedProduct.rating}</span>
                </div>
              </div>
            </div>

            <SheetFooter className="border-t border-border/60 px-5 pb-6 pt-4">
              {selectedProduct.affiliateUrl ? (
                <Button asChild className="h-12 w-full rounded-2xl text-sm font-bold">
                  <a
                    href={selectedProduct.affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    구매 링크 열기
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Button disabled className="h-12 w-full rounded-2xl text-sm font-bold">
                  링크 준비 중
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
