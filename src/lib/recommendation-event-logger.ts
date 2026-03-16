import { adminDb } from '@/lib/firebase/admin';

export type RecommendationEventType = 'open_detail' | 'click_cta';

export type RecommendationEventInput = {
  eventType: RecommendationEventType;
  productId: string;
  productName: string;
  productCategory: string;
  productSpecies: string;
  currentSpeciesFilter: string;
  currentCategoryFilter: string | null;
  hasAffiliateUrl: boolean;
  userId?: string | null;
};

export async function logRecommendationEvent({
  eventType,
  productId,
  productName,
  productCategory,
  productSpecies,
  currentSpeciesFilter,
  currentCategoryFilter,
  hasAffiliateUrl,
  userId,
}: RecommendationEventInput) {
  try {
    await adminDb.collection('recommendationEvents').add({
      eventType,
      productId,
      productName,
      productCategory,
      productSpecies,
      currentSpeciesFilter,
      currentCategoryFilter: currentCategoryFilter ?? null,
      hasAffiliateUrl,
      userId: userId ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // 추천 이벤트 로깅 실패는 UX에 영향 주지 않음
  }
}
