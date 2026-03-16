import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifySessionCookie, mockLogRecommendationEvent, mockCookiesGet } = vi.hoisted(() => ({
  mockVerifySessionCookie: vi.fn(),
  mockLogRecommendationEvent: vi.fn(),
  mockCookiesGet: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: (...args: unknown[]) => mockVerifySessionCookie(...args),
  },
}));

vi.mock('@/lib/recommendation-event-logger', () => ({
  logRecommendationEvent: (...args: unknown[]) => mockLogRecommendationEvent(...args),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (...args: unknown[]) => mockCookiesGet(...args),
  }),
}));

import { POST } from '../route';

function makePost(body: unknown, ip = '127.0.0.1') {
  return new Request('http://localhost:3000/api/recommendation-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/recommendation-events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue({ value: 'session-cookie' });
    mockVerifySessionCookie.mockResolvedValue({ uid: 'user-123' });
    mockLogRecommendationEvent.mockResolvedValue(undefined);
  });

  it('추천 이벤트를 저장한다', async () => {
    const response = await POST(makePost({
      eventType: 'open_detail',
      productId: 'cat-food-orijen',
      productName: '오리젠 캣 & 키튼',
      productCategory: 'food',
      productSpecies: 'cat',
      currentSpeciesFilter: 'cat',
      currentCategoryFilter: 'food',
      hasAffiliateUrl: true,
    }));
    const json = await response.json() as { ok: boolean };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockLogRecommendationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'open_detail',
        productId: 'cat-food-orijen',
        userId: 'user-123',
      }),
    );
  });

  it('세션 검증 실패 시에도 userId 없이 저장한다', async () => {
    mockVerifySessionCookie.mockRejectedValue(new Error('bad session'));

    const response = await POST(makePost({
      eventType: 'click_cta',
      productId: 'cat-food-orijen',
      productName: '오리젠 캣 & 키튼',
      productCategory: 'food',
      productSpecies: 'cat',
      currentSpeciesFilter: 'cat',
      currentCategoryFilter: null,
      hasAffiliateUrl: true,
    }));

    expect(response.status).toBe(200);
    expect(mockLogRecommendationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'click_cta',
        userId: null,
      }),
    );
  });

  it('필수 필드가 없으면 400을 반환한다', async () => {
    const response = await POST(makePost({
      productId: 'cat-food-orijen',
    }));

    expect(response.status).toBe(400);
    expect(mockLogRecommendationEvent).not.toHaveBeenCalled();
  });
});
