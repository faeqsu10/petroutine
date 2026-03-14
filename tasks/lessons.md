# Petroutine - Lessons Learned

> 프로젝트 진행 중 배운 교훈을 기록합니다.
> 세션 시작 시 이 파일을 리뷰하세요.

---

<!-- 교훈은 아래 형식으로 추가:
### [날짜] 교훈 제목
- **문제**: 무엇이 잘못되었는가
- **원인**: 왜 발생했는가
- **해결**: 어떻게 고쳤는가
- **규칙**: 앞으로 이것을 방지하기 위한 규칙
-->

### [2026-03-14] Firestore 쿼리에 userId 필터 누락 → 조용한 조회 실패
- **문제**: 케어 항목 저장은 성공하지만 목록에 표시되지 않음. 콘솔에 에러 없음.
- **원인**: `useCareItems` 쿼리에 `where('userId', '==', uid)` 누락. Firestore 보안 규칙(`isOwner`)이 `resource.data.userId == request.auth.uid`를 요구하는데, 쿼리에 userId 필터가 없으면 Firestore가 PERMISSION_DENIED를 반환. React Query가 이 에러를 삼켜서 빈 배열로 처리.
- **해결**: careItems, careSchedules, careLogs, expenseCategories 쿼리에 userId 필터 추가. 복합 인덱스에도 userId 필드 추가 후 재배포.
- **규칙**: Firestore `isOwner()` 규칙이 있는 컬렉션의 list 쿼리에는 반드시 `where('userId', '==', uid)` 포함. 복합 인덱스도 userId를 첫 번째 필드로. 새 훅 작성 시 `firestore.rules` 먼저 확인.

### [2026-03-14] 쿼리 필드 조합 변경 시 Firestore 인덱스 누락
- **문제**: "전체 보기" 탭 추가로 petId 없이 `userId + isActive`만으로 쿼리하는 새 패턴이 생겼으나, 복합 인덱스를 함께 추가하지 않아 에러 발생. 가계부도 `useMonthlyStats`에서 `orderBy` 없이 쿼리하면서 ASC 인덱스가 없어 에러 발생.
- **원인**: 기존 쿼리를 수정하거나 새 쿼리 패턴을 추가할 때 `firestore.indexes.json` 업데이트를 빠뜨림.
- **해결**: `careItems: userId + isActive` 인덱스 추가, `expenses: userId + expenseDate ASC` 인덱스 추가 후 배포.
- **규칙**: 쿼리의 `where` 필드 조합이나 `orderBy` 방향이 바뀔 때마다 반드시 `firestore.indexes.json`에 해당 복합 인덱스를 추가하고 `npx firebase-tools deploy --only firestore:indexes`로 배포. 배포 후 1~2분 빌드 시간 필요.

### [2026-03-14] CSS 클래스 우선순위 충돌 (bento-item vs bg-primary)
- **문제**: 지출 금액 입력 카드에 `bento-item bg-primary`를 함께 적용했으나, `bento-item`의 `bg-card`가 `bg-primary`를 덮어써서 흰색 배경으로 표시됨.
- **원인**: `bento-item` 클래스가 `@apply bg-card ...`로 배경색을 설정하는데, Tailwind에서 같은 속성의 유틸리티 클래스는 뒤에 오는 것이 아니라 CSS 소스 순서에 따라 적용됨.
- **해결**: `bento-item` 제거 → 필요한 스타일(`rounded-xl`)만 직접 적용.
- **규칙**: 커스텀 CSS 클래스(`bento-item`, `glass` 등)와 Tailwind 유틸리티를 함께 쓸 때, 커스텀 클래스가 어떤 속성을 설정하는지 `globals.css`에서 먼저 확인. 배경색/텍스트색을 오버라이드하려면 커스텀 클래스를 빼고 직접 적용.
