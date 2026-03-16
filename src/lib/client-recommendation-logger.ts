import type { RecommendationEventInput } from '@/lib/recommendation-event-logger';

export async function logClientRecommendationEvent(input: RecommendationEventInput) {
  try {
    await fetch('/api/recommendation-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      keepalive: true,
    });
  } catch {
    // fire-and-forget
  }
}
