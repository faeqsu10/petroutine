import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// next/server 모킹
// NextRequest — cookies.get() 과 nextUrl.pathname 을 지원하는 최소 스텁
// NextResponse — redirect(), next() 스파이
// ============================================================
const { mockRedirect, mockNext } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockNext: vi.fn(),
}));

vi.mock('next/server', () => {
  class MockNextRequest {
    cookies: { get: (name: string) => { value: string } | undefined };
    nextUrl: { pathname: string };
    url: string;

    constructor(
      url: string,
      cookieMap: Record<string, string> = {},
    ) {
      this.url = url;
      const parsed = new URL(url);
      this.nextUrl = { pathname: parsed.pathname };
      this.cookies = {
        get: (name: string) =>
          cookieMap[name] !== undefined ? { value: cookieMap[name] } : undefined,
      };
    }
  }

  const MockNextResponse = {
    redirect: mockRedirect,
    next: mockNext,
  };

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// ============================================================
// 테스트 대상 임포트 (모킹 등록 이후)
// ============================================================
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// ============================================================
// 헬퍼
// ============================================================
function makeRequest(
  pathname: string,
  options: { authenticated?: boolean } = {},
) {
  const cookieMap = options.authenticated ? { __session: 'mock-session-token' } : {};
  // MockNextRequest의 두 번째 인자는 cookieMap (Record<string, string>)
  return new (NextRequest as unknown as new (
    url: string,
    cookieMap: Record<string, string>,
  ) => InstanceType<typeof NextRequest>)(
    `http://localhost${pathname}`,
    cookieMap,
  );
}

// ============================================================
// 테스트
// ============================================================
describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockReturnValue({ type: 'redirect' });
    mockNext.mockReturnValue({ type: 'next' });
  });

  // ─── 비인증 사용자 ─────────────────────────────────────────
  describe('비인증 사용자 (세션 없음)', () => {
    it('보호된 경로 접근 시 /welcome으로 리다이렉트된다', () => {
      const req = makeRequest('/care');
      middleware(req);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/welcome');
    });

    it('/welcome 접근 시 리다이렉트 없이 통과한다', () => {
      const req = makeRequest('/welcome');
      middleware(req);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('/login 접근 시 리다이렉트 없이 통과한다', () => {
      const req = makeRequest('/login');
      middleware(req);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 인증 사용자 ──────────────────────────────────────────
  describe('인증 사용자 (세션 있음)', () => {
    it('/welcome 접근 시 /로 리다이렉트된다', () => {
      const req = makeRequest('/welcome', { authenticated: true });
      middleware(req);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/');
    });

    it('/login 접근 시 /로 리다이렉트된다', () => {
      const req = makeRequest('/login', { authenticated: true });
      middleware(req);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/');
    });

    it('/care 접근 시 리다이렉트 없이 정상 통과한다', () => {
      const req = makeRequest('/care', { authenticated: true });
      middleware(req);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
