import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => React.createElement('span'),
  Eye: () => React.createElement('span'),
  MousePointerClick: () => React.createElement('span'),
  Sparkles: () => React.createElement('span'),
}));

const mockUseRecommendationAnalytics = vi.fn();
vi.mock('@/hooks/use-recommendation-analytics', () => ({
  useRecommendationAnalytics: (...args: unknown[]) => mockUseRecommendationAnalytics(...args),
}));

import RecommendationSettingsPage from '../page';

describe('RecommendationSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRecommendationAnalytics.mockReturnValue({
      data: {
        totalDetailOpens: 12,
        totalCtaClicks: 3,
        clickThroughRate: 25,
        sampleSize: 18,
        topOpenedProducts: [
          { key: 'cat-food-orijen', label: '오리젠 캣 & 키튼', count: 5 },
        ],
        topClickedProducts: [
          { key: 'cat-food-orijen', label: '오리젠 캣 & 키튼', count: 2 },
        ],
        bySpeciesFilter: [
          { key: 'cat', label: 'cat', count: 7 },
        ],
        byCategoryFilter: [
          { key: 'food', label: 'food', count: 6 },
        ],
      },
      isLoading: false,
      isError: false,
    });
  });

  it('추천 로그 요약을 렌더링한다', () => {
    render(<RecommendationSettingsPage />);

    expect(screen.getByText('추천 로그')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('Top 상품과 필터 현황을 표시한다', () => {
    render(<RecommendationSettingsPage />);

    expect(screen.getAllByText('오리젠 캣 & 키튼').length).toBeGreaterThan(0);
    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.getByText('food')).toBeInTheDocument();
  });
});
