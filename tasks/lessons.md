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

### [2026-03-15] COOP가 있는 앱에서 Firebase popup auth 사용 시 브라우저 경고 반복
- **문제**: Google 로그인 시 `Cross-Origin-Opener-Policy policy would block the window.closed/window.close call` 경고가 반복되고, 팝업 인증 흐름이 브라우저 정책에 민감하게 흔들림.
- **원인**: 앱 전체에 COOP 헤더가 적용된 상태에서 `signInWithPopup`이 cross-origin 팝업의 `window.closed`/`window.close()`를 참조함. Firebase SDK 내부 popup polling/cleanup 로직이 브라우저 정책과 충돌.
- **해결**: 로그인 흐름을 `signInWithRedirect` 기반으로 전환하고, `prompt: 'select_account'`는 유지해 계정 선택 UX를 보장.
- **규칙**: COOP/보안 헤더를 유지하는 앱에서는 OAuth 기본 전략을 popup이 아니라 redirect로 설계. popup은 인증 전용 경로에서 헤더 예외 처리가 명확할 때만 제한적으로 사용.

### [2026-03-15] Firebase redirect auth는 복귀 결과를 먼저 소비해야 로그인 루프를 막을 수 있음
- **문제**: Google 로그인 후 인증은 성공했는데 다시 로그인 화면으로 돌아감.
- **원인**: `signInWithRedirect`로 전환한 뒤 `getRedirectResult()`를 제거해, 복귀 직후 redirect 결과를 명시적으로 소비하지 못함. 그 사이 `onAuthStateChanged` fallback 경로가 먼저 `null` 또는 미완료 상태를 처리하면 세션 쿠키 생성이 건너뛰어져 미들웨어가 다시 로그인 화면으로 보냄.
- **해결**: 로그인 페이지에서 `getRedirectResult(auth)`를 먼저 처리하고, 결과가 있으면 세션 쿠키 생성 완료 후 `/`로 이동. `onAuthStateChanged`는 새로고침/기존 세션 복구용 fallback으로만 유지.
- **규칙**: Firebase redirect auth에서는 `getRedirectResult()`를 제거하지 말고, redirect 결과 처리 → 세션 생성 → 라우팅 순서를 보장. 관련 회귀 테스트도 반드시 유지.

### [2026-03-15] Vercel에서 Firebase redirect auth를 쓸 때 auth helper를 same-site로 프록시해야 함
- **문제**: `Authorized domains`와 Google provider 설정이 정상이어도 Vercel 배포에서 redirect 로그인 후 세션 생성 API까지 도달하지 못함.
- **원인**: 앱 도메인은 `*.vercel.app`인데 `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`이 `*.firebaseapp.com`이면 redirect helper가 cross-site로 동작한다. 브라우저의 third-party storage 제한 때문에 redirect 결과 복구가 깨질 수 있음.
- **해결**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`을 앱 도메인으로 맞추고, `next.config.ts` rewrites로 `__/auth/*`와 `__/firebase/*`를 Firebase Hosting helper로 프록시.
- **규칙**: Firebase Hosting이 아닌 호스트(Vercel 등)에서 `signInWithRedirect`를 쓸 때는 `authDomain`만 바꾸지 말고 same-site helper 경로(`__/auth`, `__/firebase`)를 함께 제공.

### [2026-03-15] 인증 helper 경로는 미들웨어 예외 대상이어야 하고 Cloud Functions 소스는 Next 빌드에서 제외해야 함
- **문제**: `__/auth/handler` 요청이 인증 미들웨어에 걸려 `/welcome`으로 리다이렉트되고, Vercel 배포는 `functions/src` 타입 에러 때문에 실패함.
- **원인**: `middleware.ts`의 public path 목록에 `__/auth`, `__/firebase`가 없었고, 루트 `tsconfig.json`이 `functions/`까지 `include`해 Next build가 Cloud Functions 코드를 함께 타입 체크함.
- **해결**: `middleware.ts`에 Firebase helper 경로 예외 추가, 관련 테스트 추가. 루트 `tsconfig.json`에서 `functions/` 제외.
- **규칙**: OAuth/helper 내부 경로(`__/auth`, `__/firebase`)는 인증 미들웨어에서 절대 막지 말 것. Next 앱과 별도 런타임(Cloud Functions, scripts)은 루트 TS 빌드 범위에서 명시적으로 제외.

### [2026-03-15] `/__/auth/handler` 직접 접속 오류와 `/__/firebase/init.json` 404는 구분해서 봐야 함
- **문제**: 배포 후 `/__/auth/handler`는 “missing initial state”를 보여주고, `/__/firebase/init.json`은 404였다.
- **원인**: `__/auth/handler`는 redirect 로그인 흐름 중에만 열리는 helper라 직접 열면 초기 state가 없어 오류가 나는 게 정상이다. 반면 `__/firebase/init.json`은 앱 도메인에서 same-site로 제공돼야 하는데, Firebase Hosting에 없는 파일로 프록시하고 있어 404가 났다.
- **해결**: `next.config.ts`에서 `/__/firebase/init.json`을 앱 내부 API(`/api/firebase/init`)로 rewrite하고, 해당 API가 env 기반 Firebase config JSON을 직접 응답하도록 구현.
- **규칙**: Firebase helper 경로를 수동 점검할 때 `__/auth/handler`는 직접 접속 성공 여부로 판단하지 말고, `__/firebase/init.json`이 200 JSON으로 내려오는지와 실제 로그인 왕복이 되는지를 기준으로 확인.

### [2026-03-15] Service Worker는 auth/helper 경로를 캐시하거나 가로채면 안 됨
- **문제**: OAuth redirect 구성이 맞아도 로그인 복귀 상태가 꼬이거나 오래된 응답이 남아 auth 흐름이 불안정할 수 있음.
- **원인**: `public/sw.js`가 모든 GET 요청을 네트워크 우선 + 캐시 fallback 대상으로 다루고 있어 `/__/auth/*`, `/__/firebase/*`, `/login` 같은 인증 민감 경로까지 service worker 영향권에 들어감.
- **해결**: service worker가 `__/`, `/login`, `/signup`, `/welcome`, `/auth/` 경로를 우회하도록 수정하고 캐시 버전을 올림.
- **규칙**: OAuth redirect, 세션 복구, helper 초기화에 관여하는 경로는 service worker 캐시 대상에서 제외. 인증 이슈 추적 시 DevTools에서 service worker unregister + site data clear도 함께 확인.
