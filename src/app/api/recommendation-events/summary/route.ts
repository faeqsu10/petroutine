import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  buildRecommendationAnalyticsSummary,
  type RecommendationEventRecord,
} from '@/lib/recommendation-analytics';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const snapshot = await adminDb
    .collection('recommendationEvents')
    .orderBy('timestamp', 'desc')
    .limit(200)
    .get();

  const events = snapshot.docs.map((docSnap) => docSnap.data() as RecommendationEventRecord);
  const summary = buildRecommendationAnalyticsSummary(events);

  return NextResponse.json(summary);
}
