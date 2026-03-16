import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockVerifySessionCookie,
  mockCookiesGet,
  mockGet,
} = vi.hoisted(() => ({
  mockVerifySessionCookie: vi.fn(),
  mockCookiesGet: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: (...args: unknown[]) => mockVerifySessionCookie(...args),
  },
  adminDb: {
    collection: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: (...args: unknown[]) => mockGet(...args),
        })),
      })),
    })),
  },
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (...args: unknown[]) => mockCookiesGet(...args),
  }),
}));

import { GET } from '../route';

describe('GET /api/recommendation-events/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue({ value: 'session-cookie' });
    mockVerifySessionCookie.mockResolvedValue({ uid: 'user-123' });
    mockGet.mockResolvedValue({
      docs: [
        {
          data: () => ({
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
          }),
        },
        {
          data: () => ({
            eventType: 'click_cta',
            productId: 'cat-food-orijen',
            productName: '오리젠 캣 & 키튼',
            productCategory: 'food',
            productSpecies: 'cat',
            currentSpeciesFilter: 'cat',
            currentCategoryFilter: 'food',
            hasAffiliateUrl: true,
            userId: 'user-123',
            timestamp: '2026-03-16T01:01:00.000Z',
          }),
        },
      ],
    });
  });

  it('추천 이벤트 집계를 반환한다', async () => {
    const response = await GET();
    const json = await response.json() as {
      totalDetailOpens: number;
      totalCtaClicks: number;
      clickThroughRate: number;
    };

    expect(response.status).toBe(200);
    expect(json.totalDetailOpens).toBe(1);
    expect(json.totalCtaClicks).toBe(1);
    expect(json.clickThroughRate).toBe(100);
  });

  it('세션 쿠키가 없으면 401을 반환한다', async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const response = await GET();

    expect(response.status).toBe(401);
  });
});
