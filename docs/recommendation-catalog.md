# Recommendation Catalog Operations

추천 카탈로그는 `curatedProducts` 컬렉션으로 운영한다. 추천 탭은 이 컬렉션만 읽고, 로컬 더미 상수는 시드 기본값과 타입 정의 용도로만 유지한다.

문서 스키마는 `name`, `category`, `species`, `price`, `description`, `rating`, `affiliateUrl`, `imageUrl`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`을 기준으로 맞춘다. 추천 탭은 현재 `isActive === true` 인 문서만 노출하고, 화면 정렬은 `sortOrder` 오름차순을 사용한다.

초기 카탈로그를 다시 넣거나 덮어쓸 때는 `npx tsx scripts/seed-curated-products.ts`를 실행한다. 이 스크립트는 `DEFAULT_CURATED_PRODUCTS`를 기준으로 문서를 업서트하므로, 카탈로그 기본값을 바꾸려면 먼저 `src/lib/curated-products.ts`를 수정한 뒤 시드를 다시 실행하면 된다.

운영 중에는 `affiliateUrl` 유무가 CTA 상태를 결정한다. 링크가 있으면 추천 상세 시트에서 외부 이동 버튼을 활성화하고, 링크가 없으면 `링크 준비 중` 버튼으로 유지한다. 제휴사가 아직 없으면 카탈로그를 비워둘 필요는 없고, `affiliateUrl: null` 상태로 큐레이션만 유지하면 된다.

추천 행동 로그는 `recommendationEvents` 컬렉션에 쌓인다. 현재 `open_detail` 과 `click_cta` 두 이벤트를 기록하며, `productId`, `productCategory`, `currentSpeciesFilter`, `currentCategoryFilter`, `hasAffiliateUrl`, `userId`, `timestamp`를 남긴다. 제휴 링크가 붙기 전에도 어떤 상품이 자주 열리고 클릭되는지 확인할 수 있도록 이 로그를 유지한다.
