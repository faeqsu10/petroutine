import { describe, it, expect } from 'vitest';
import { buildRecommendationAnalyticsSummary } from '../recommendation-analytics';

describe('buildRecommendationAnalyticsSummary', () => {
  it('추천 이벤트를 집계한다', () => {
    const summary = buildRecommendationAnalyticsSummary([
      {
        eventType: 'open_detail',
        productId: 'cat-food-orijen',
        productName: '오리젠 캣 & 키튼',
        productCategory: 'food',
        productSpecies: 'cat',
        currentSpeciesFilter: 'cat',
        currentCategoryFilter: 'food',
        hasAffiliateUrl: true,
        userId: 'user-123',
        timestamp: '2026-03-16T01:00:00.000Z',
      },
      {
        eventType: 'open_detail',
        productId: 'cat-food-orijen',
        productName: '오리젠 캣 & 키튼',
        productCategory: 'food',
        productSpecies: 'cat',
        currentSpeciesFilter: 'cat',
        currentCategoryFilter: 'food',
        hasAffiliateUrl: true,
        userId: 'user-123',
        timestamp: '2026-03-16T01:01:00.000Z',
      },
      {
        eventType: 'click_cta',
        productId: 'cat-food-orijen',
        productName: '오리젠 캣 & 키튼',
        productCategory: 'food',
        productSpecies: 'cat',
        currentSpeciesFilter: 'cat',
        currentCategoryFilter: 'food',
        hasAffiliateUrl: true,
        userId: 'user-123',
        timestamp: '2026-03-16T01:02:00.000Z',
      },
    ]);

    expect(summary.totalDetailOpens).toBe(2);
    expect(summary.totalCtaClicks).toBe(1);
    expect(summary.clickThroughRate).toBe(50);
    expect(summary.topOpenedProducts[0]).toEqual({
      key: 'cat-food-orijen',
      label: '오리젠 캣 & 키튼',
      count: 2,
    });
  });
});
