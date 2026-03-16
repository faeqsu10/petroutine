'use client';

import { useQuery } from '@tanstack/react-query';
import type { RecommendationAnalyticsSummary } from '@/lib/recommendation-analytics';

const RECOMMENDATION_ANALYTICS_KEY = 'recommendation-analytics';

export function useRecommendationAnalytics() {
  return useQuery({
    queryKey: [RECOMMENDATION_ANALYTICS_KEY],
    queryFn: async (): Promise<RecommendationAnalyticsSummary> => {
      const response = await fetch('/api/recommendation-events/summary', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load recommendation analytics');
      }

      return response.json() as Promise<RecommendationAnalyticsSummary>;
    },
  });
}
