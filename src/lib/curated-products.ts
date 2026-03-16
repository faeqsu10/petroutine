import type { Pet } from '@/types';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

export type RecommendationSpeciesFilter = 'all' | 'dog' | 'cat';
export type CuratedProductCategory = keyof typeof PRODUCT_CATEGORIES;

export interface CuratedProduct {
  id: string;
  name: string;
  category: CuratedProductCategory;
  species: RecommendationSpeciesFilter;
  price: number;
  imageUrl: string | null;
  description: string;
  rating: number;
  affiliateUrl: string | null;
}

export const CURATED_PRODUCTS: CuratedProduct[] = [
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
  },
];

export function getDefaultRecommendationSpecies(
  pets: Pick<Pet, 'id' | 'species'>[] | undefined,
  selectedPetId: string | null,
): RecommendationSpeciesFilter {
  if (!pets?.length) {
    return 'all';
  }

  const selectedPet =
    selectedPetId && selectedPetId !== 'all'
      ? pets.find((pet) => pet.id === selectedPetId)
      : null;
  const fallbackPet = selectedPet ?? pets[0];

  if (fallbackPet.species === 'dog' || fallbackPet.species === 'cat') {
    return fallbackPet.species;
  }

  return 'all';
}

export function getProductCategoryMeta(category: CuratedProductCategory): {
  emoji: string;
  label: string;
} {
  const [emoji, label] = PRODUCT_CATEGORIES[category].split(' ');
  return {
    emoji,
    label,
  };
}

export function getSpeciesLabel(species: RecommendationSpeciesFilter): string {
  switch (species) {
    case 'dog':
      return '강아지 전용';
    case 'cat':
      return '고양이 전용';
    default:
      return '공용';
  }
}
