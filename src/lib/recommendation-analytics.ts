import type { RecommendationEventType } from '@/lib/recommendation-event-logger';

export type RecommendationEventRecord = {
  eventType: RecommendationEventType;
  productId: string;
  productName: string;
  productCategory: string;
  productSpecies: string;
  currentSpeciesFilter: string;
  currentCategoryFilter: string | null;
  hasAffiliateUrl: boolean;
  userId: string | null;
  timestamp: string;
};

export type RecommendationCountRow = {
  key: string;
  label: string;
  count: number;
};

export type RecommendationAnalyticsSummary = {
  totalDetailOpens: number;
  totalCtaClicks: number;
  clickThroughRate: number;
  topOpenedProducts: RecommendationCountRow[];
  topClickedProducts: RecommendationCountRow[];
  bySpeciesFilter: RecommendationCountRow[];
  byCategoryFilter: RecommendationCountRow[];
  sampleSize: number;
};

function toSortedRows(counter: Map<string, { label: string; count: number }>) {
  return Array.from(counter.entries())
    .map(([key, value]) => ({ key, label: value.label, count: value.count }))
    .sort((a, b) => b.count - a.count);
}

export function buildRecommendationAnalyticsSummary(
  events: RecommendationEventRecord[],
): RecommendationAnalyticsSummary {
  const detailOpenMap = new Map<string, { label: string; count: number }>();
  const ctaClickMap = new Map<string, { label: string; count: number }>();
  const speciesFilterMap = new Map<string, { label: string; count: number }>();
  const categoryFilterMap = new Map<string, { label: string; count: number }>();

  let totalDetailOpens = 0;
  let totalCtaClicks = 0;

  for (const event of events) {
    if (event.eventType === 'open_detail') {
      totalDetailOpens += 1;
      const entry = detailOpenMap.get(event.productId) ?? { label: event.productName, count: 0 };
      entry.count += 1;
      detailOpenMap.set(event.productId, entry);
    }

    if (event.eventType === 'click_cta') {
      totalCtaClicks += 1;
      const entry = ctaClickMap.get(event.productId) ?? { label: event.productName, count: 0 };
      entry.count += 1;
      ctaClickMap.set(event.productId, entry);
    }

    const speciesEntry = speciesFilterMap.get(event.currentSpeciesFilter) ?? {
      label: event.currentSpeciesFilter,
      count: 0,
    };
    speciesEntry.count += 1;
    speciesFilterMap.set(event.currentSpeciesFilter, speciesEntry);

    const categoryKey = event.currentCategoryFilter ?? 'all';
    const categoryLabel = event.currentCategoryFilter ?? '전체';
    const categoryEntry = categoryFilterMap.get(categoryKey) ?? {
      label: categoryLabel,
      count: 0,
    };
    categoryEntry.count += 1;
    categoryFilterMap.set(categoryKey, categoryEntry);
  }

  return {
    totalDetailOpens,
    totalCtaClicks,
    clickThroughRate:
      totalDetailOpens === 0 ? 0 : Number(((totalCtaClicks / totalDetailOpens) * 100).toFixed(1)),
    topOpenedProducts: toSortedRows(detailOpenMap).slice(0, 5),
    topClickedProducts: toSortedRows(ctaClickMap).slice(0, 5),
    bySpeciesFilter: toSortedRows(speciesFilterMap),
    byCategoryFilter: toSortedRows(categoryFilterMap),
    sampleSize: events.length,
  };
}
