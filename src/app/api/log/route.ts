import { logError } from '@/lib/error-logger';
import { NextResponse } from 'next/server';

// 단순 rate limit: IP당 요청 수 추적 (인메모리, 프로세스 재시작 시 초기화)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // 1분당 최대 요청 수
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count += 1;
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }

  let body: { source?: unknown; message?: unknown; detail?: unknown };
  try {
    body = await request.json() as { source?: unknown; message?: unknown; detail?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const source = typeof body.source === 'string' ? body.source.slice(0, 100) : 'client';
  const message = typeof body.message === 'string' ? body.message.slice(0, 500) : 'unknown';
  const detail = typeof body.detail === 'string' ? body.detail.slice(0, 1000) : undefined;

  await logError(source, message, detail);

  return NextResponse.json({ ok: true });
}
