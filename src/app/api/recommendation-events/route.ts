import { adminAuth } from '@/lib/firebase/admin';
import { logRecommendationEvent } from '@/lib/recommendation-event-logger';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
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

function readString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const eventType = readString(body.eventType, 32);
  const productId = readString(body.productId, 128);
  const productName = readString(body.productName, 200);
  const productCategory = readString(body.productCategory, 64);
  const productSpecies = readString(body.productSpecies, 32);
  const currentSpeciesFilter = readString(body.currentSpeciesFilter, 32);
  const currentCategoryFilter =
    body.currentCategoryFilter === null || body.currentCategoryFilter === undefined
      ? null
      : readString(body.currentCategoryFilter, 64);
  const hasAffiliateUrl = typeof body.hasAffiliateUrl === 'boolean' ? body.hasAffiliateUrl : false;

  if (
    (eventType !== 'open_detail' && eventType !== 'click_cta') ||
    !productId ||
    !productName ||
    !productCategory ||
    !productSpecies ||
    !currentSpeciesFilter
  ) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      userId = decoded.uid;
    }
  } catch {
    userId = null;
  }

  await logRecommendationEvent({
    eventType,
    productId,
    productName,
    productCategory,
    productSpecies,
    currentSpeciesFilter,
    currentCategoryFilter,
    hasAffiliateUrl,
    userId,
  });

  return NextResponse.json({ ok: true });
}
