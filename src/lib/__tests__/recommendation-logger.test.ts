import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAdd = vi.fn();
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      add: mockAdd,
    })),
  },
}));

import { logRecommendationEvent } from '../recommendation-event-logger';
import { logClientRecommendationEvent } from '../client-recommendation-logger';

describe('logRecommendationEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('추천 이벤트를 Firestore에 기록한다', async () => {
    mockAdd.mockResolvedValueOnce({ id: 'event-doc-id' });

    await logRecommendationEvent({
      eventType: 'open_detail',
      productId: 'cat-food-orijen',
      productName: '오리젠 캣 & 키튼',
      productCategory: 'food',
      productSpecies: 'cat',
      currentSpeciesFilter: 'cat',
      currentCategoryFilter: 'food',
      hasAffiliateUrl: true,
      userId: 'user-123',
    });

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'open_detail',
        productId: 'cat-food-orijen',
        currentCategoryFilter: 'food',
        userId: 'user-123',
      }),
    );
  });
});

describe('logClientRecommendationEvent', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('추천 이벤트를 API에 전송한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await logClientRecommendationEvent({
      eventType: 'click_cta',
      productId: 'cat-food-orijen',
      productName: '오리젠 캣 & 키튼',
      productCategory: 'food',
      productSpecies: 'cat',
      currentSpeciesFilter: 'cat',
      currentCategoryFilter: null,
      hasAffiliateUrl: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/recommendation-events',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      }),
    );
  });
});
