import { describe, expect, it } from 'vitest';
import { getDefaultRecommendationSpecies, type RecommendationSpeciesFilter } from '@/lib/curated-products';

type TestPet = {
  id: string;
  species: RecommendationSpeciesFilter | 'other';
};

describe('getDefaultRecommendationSpecies', () => {
  it('선택된 펫이 있으면 해당 종을 기본 필터로 사용한다', () => {
    const pets: TestPet[] = [
      { id: 'pet-dog', species: 'dog' },
      { id: 'pet-cat', species: 'cat' },
    ];

    expect(getDefaultRecommendationSpecies(pets, 'pet-cat')).toBe('cat');
  });

  it('선택된 펫이 없으면 첫 번째 펫 종을 사용한다', () => {
    const pets: TestPet[] = [
      { id: 'pet-dog', species: 'dog' },
      { id: 'pet-cat', species: 'cat' },
    ];

    expect(getDefaultRecommendationSpecies(pets, null)).toBe('dog');
  });

  it('선택된 값이 all 이거나 other 종이면 전체로 시작한다', () => {
    const pets: TestPet[] = [
      { id: 'pet-other', species: 'other' },
      { id: 'pet-dog', species: 'dog' },
    ];

    expect(getDefaultRecommendationSpecies(pets, 'all')).toBe('all');
    expect(getDefaultRecommendationSpecies(pets, 'pet-other')).toBe('all');
  });

  it('펫 정보가 없으면 전체로 시작한다', () => {
    expect(getDefaultRecommendationSpecies(undefined, null)).toBe('all');
  });
});
