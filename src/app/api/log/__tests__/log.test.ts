import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// 모킹
// ---------------------------------------------------------------------------
const { mockLogError } = vi.hoisted(() => ({
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/error-logger', () => ({
  logError: mockLogError,
}));

// ---------------------------------------------------------------------------
// 테스트 대상 임포트
// ---------------------------------------------------------------------------
import { POST } from '../route';

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------
function makePost(body: unknown, ip = '127.0.0.1'): Request {
  return new Request('http://localhost:3000/api/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------
describe('POST /api/log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogError.mockResolvedValue(undefined);
  });

  it('POST 요청으로 에러 로그를 저장한다', async () => {
    const req = makePost({ source: 'client-app', message: '버튼 클릭 오류', detail: '스택 트레이스' });
    const res = await POST(req);
    const json = await res.json() as { ok: boolean };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith('client-app', '버튼 클릭 오류', '스택 트레이스');
  });

  it('source가 없으면 기본값 "client"로 저장한다', async () => {
    const req = makePost({ message: '오류 발생' });
    const res = await POST(req);
    const json = await res.json() as { ok: boolean };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith('client', '오류 발생', undefined);
  });

  it('message가 없으면 기본값 "unknown"으로 저장한다', async () => {
    const req = makePost({ source: 'my-app' });
    const res = await POST(req);
    const json = await res.json() as { ok: boolean };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith('my-app', 'unknown', undefined);
  });

  it('source가 100자를 초과하면 잘린다', async () => {
    const longSource = 'a'.repeat(150);
    const req = makePost({ source: longSource, message: '테스트' });
    await POST(req);

    const [calledSource] = mockLogError.mock.calls[0] as [string, string, string | undefined];
    expect(calledSource.length).toBe(100);
    expect(calledSource).toBe('a'.repeat(100));
  });

  it('잘못된 JSON이면 400을 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET 메서드 — 405 확인
// ---------------------------------------------------------------------------
describe('GET /api/log — 405', () => {
  it('GET 요청은 405를 반환한다', async () => {
    // route.ts에는 GET 핸들러가 없으므로 Next.js가 405를 반환하는 동작을 검증
    // 단위 테스트 수준에서는 GET export가 존재하지 않음을 확인한다
    const routeModule = await import('../route') as Record<string, unknown>;
    expect(routeModule['GET']).toBeUndefined();
  });
});
