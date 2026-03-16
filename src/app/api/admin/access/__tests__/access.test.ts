import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifySessionCookie, mockCookiesGet } = vi.hoisted(() => ({
  mockVerifySessionCookie: vi.fn(),
  mockCookiesGet: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: (...args: unknown[]) => mockVerifySessionCookie(...args),
  },
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (...args: unknown[]) => mockCookiesGet(...args),
  }),
}));

import { GET } from '../route';

describe('GET /api/admin/access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@example.com';
    process.env.ADMIN_UIDS = 'admin-uid';
  });

  it('관리자 이메일이면 isAdmin true를 반환한다', async () => {
    mockCookiesGet.mockReturnValue({ value: 'session-cookie' });
    mockVerifySessionCookie.mockResolvedValue({
      uid: 'user-123',
      email: 'admin@example.com',
    });

    const response = await GET();
    const json = await response.json() as { isAdmin: boolean };

    expect(response.status).toBe(200);
    expect(json.isAdmin).toBe(true);
  });

  it('관리자가 아니면 isAdmin false를 반환한다', async () => {
    mockCookiesGet.mockReturnValue({ value: 'session-cookie' });
    mockVerifySessionCookie.mockResolvedValue({
      uid: 'user-123',
      email: 'user@example.com',
    });

    const response = await GET();
    const json = await response.json() as { isAdmin: boolean };

    expect(json.isAdmin).toBe(false);
  });
});
