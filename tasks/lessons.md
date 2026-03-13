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
