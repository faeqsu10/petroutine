import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// 모킹 (vi.mock 호이스팅)
// ---------------------------------------------------------------------------
const { mockAdminAuth, mockLogError } = vi.hoisted(() => {
  return {
    mockAdminAuth: {
      updateUser: vi.fn(),
      createUser: vi.fn(),
      createCustomToken: vi.fn(),
      createSessionCookie: vi.fn(),
    },
    mockLogError: vi.fn(),
  };
});

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: mockAdminAuth,
}));

vi.mock('@/lib/error-logger', () => ({
  logError: mockLogError,
}));

// fetch는 전역 모킹
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// 테스트 대상 임포트
// ---------------------------------------------------------------------------
import { GET } from '../route';

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------
function makeRequest(url: string, host = 'localhost:3000'): Request {
  return new Request(url, {
    headers: { host },
  });
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeTextResponse(body: string, status = 400): Response {
  return new Response(body, { status });
}

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------
describe('GET /api/auth/kakao/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KAKAO_REST_API_KEY = 'test-kakao-key';
    process.env.KAKAO_CLIENT_SECRET = 'test-kakao-secret';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-firebase-key';
    process.env.NODE_ENV = 'test';
  });

  it('code 파라미터가 없으면 /login으로 리다이렉트한다', async () => {
    const req = makeRequest('http://localhost:3000/api/auth/kakao/callback');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login?error=kakao_no_code');
    expect(mockLogError).toHaveBeenCalledWith('kakao-callback', 'code', 'Missing authorization code');
  });

  it('토큰 교환 실패 시 에러 리다이렉트한다', async () => {
    mockFetch.mockResolvedValueOnce(makeTextResponse('invalid_client', 401));

    const req = makeRequest('http://localhost:3000/api/auth/kakao/callback?code=bad-code');
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/login?error=');
    expect(mockLogError).toHaveBeenCalledWith('kakao-callback', 'token_exchange', expect.stringContaining('401'));
  });

  it('성공 시 세션 쿠키를 설정하고 /로 리다이렉트한다', async () => {
    // 1) 토큰 교환 성공
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ access_token: 'kakao-access-token' }));
    // 2) 사용자 정보 조회 성공
    mockFetch.mockResolvedValueOnce(makeJsonResponse({
      id: 12345,
      properties: { nickname: '테스트유저', profile_image: 'https://example.com/img.jpg' },
      kakao_account: { email: 'test@example.com' },
    }));
    // 3) Firebase custom token sign-in 성공
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ idToken: 'firebase-id-token' }));

    mockAdminAuth.updateUser.mockResolvedValue(undefined);
    mockAdminAuth.createCustomToken.mockResolvedValue('custom-token-123');
    mockAdminAuth.createSessionCookie.mockResolvedValue('session-cookie-value');

    const req = makeRequest('http://localhost:3000/api/auth/kakao/callback?code=valid-code');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('__session=session-cookie-value');
    expect(setCookie).toContain('HttpOnly');
    expect(mockAdminAuth.createSessionCookie).toHaveBeenCalledWith('firebase-id-token', expect.any(Object));
  });
});
