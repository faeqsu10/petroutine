import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// firebase-admin/firestore 모킹
// ============================================================
const mockAdd = vi.fn();
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      add: mockAdd,
    })),
  },
}));

// ============================================================
// 테스트 대상 임포트
// ============================================================
import { logError } from '../error-logger';
import { logClientError } from '../client-error-logger';

// ============================================================
// logError 테스트
// ============================================================
describe('logError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logError가 Firestore에 문서를 추가한다', async () => {
    mockAdd.mockResolvedValueOnce({ id: 'new-doc-id' });

    await logError('test-source', 'test message', 'detail info', 'user-123');

    expect(mockAdd).toHaveBeenCalledOnce();
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'test-source',
        level: 'error',
        message: 'test message',
        detail: 'detail info',
        userId: 'user-123',
      }),
    );
  });

  it('logError 실패 시 에러를 던지지 않는다', async () => {
    mockAdd.mockRejectedValueOnce(new Error('Firestore error'));

    // 에러가 throw되지 않아야 함
    await expect(logError('source', 'message')).resolves.toBeUndefined();
  });

  it('detail과 userId가 없으면 null로 저장한다', async () => {
    mockAdd.mockResolvedValueOnce({ id: 'doc-id' });

    await logError('source', 'message');

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: null,
        userId: null,
      }),
    );
  });

  it('timestamp 필드가 포함된다', async () => {
    mockAdd.mockResolvedValueOnce({ id: 'doc-id' });

    const before = new Date().toISOString();
    await logError('source', 'message');
    const after = new Date().toISOString();

    const callArg = mockAdd.mock.calls[0][0] as Record<string, string>;
    expect(typeof callArg.timestamp).toBe('string');
    expect(callArg.timestamp >= before).toBe(true);
    expect(callArg.timestamp <= after).toBe(true);
  });
});

// ============================================================
// logClientError 테스트
// ============================================================
describe('logClientError', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('logClientError가 /api/log에 POST 요청을 보낸다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await logClientError('client-source', 'client message', 'client detail');

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/log',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'client-source',
          message: 'client message',
          detail: 'client detail',
        }),
      }),
    );
  });

  it('logClientError 실패 시 에러를 던지지 않는다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // 에러가 throw되지 않아야 함
    await expect(logClientError('source', 'message')).resolves.toBeUndefined();
  });

  it('detail 없이도 올바르게 요청을 보낸다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await logClientError('source', 'message');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/log',
      expect.objectContaining({
        body: JSON.stringify({
          source: 'source',
          message: 'message',
          detail: undefined,
        }),
      }),
    );
  });
});
