# 로그인 체크리스트

이 문서는 Petroutine의 Google 로그인 문제가 다시 생겼을 때, 코드와 설정을 어떤 순서로 확인해야 하는지 정리한다. 현재 배포 기준 도메인은 `https://petroutine-ielc.vercel.app` 이고, 로그인 방식은 Firebase `signInWithRedirect()`와 세션 쿠키 조합이다.

## 현재 구조

로그인 버튼은 [`src/app/(auth)/login/page.tsx`](/home/faeqsu10/projects/petroutine/src/app/(auth)/login/page.tsx) 에서 `signInWithRedirect()`를 호출한다. 로그인 복귀 후에는 `getRedirectResult(auth)`를 먼저 소비하고, Firebase `User`가 확보되면 [`/api/auth/session`](/home/faeqsu10/projects/petroutine/src/app/api/auth/session/route.ts) 으로 ID token을 보내 세션 쿠키 `__session`을 만든 뒤 홈으로 이동한다. 이 순서가 깨지면 인증은 성공해도 다시 로그인 화면으로 돌아갈 수 있다.

배포 환경에서는 `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`을 앱 도메인과 동일한 `petroutine-ielc.vercel.app`로 두고, [`next.config.ts`](/home/faeqsu10/projects/petroutine/next.config.ts) 에서 `__/auth/*`와 `__/firebase/init.json`을 same-site 경로로 제공한다. `__/auth/*`는 Firebase Hosting helper로 rewrite되고, `__/firebase/init.json`은 [`/api/firebase/init`](/home/faeqsu10/projects/petroutine/src/app/api/firebase/init/route.ts) 이 env 값을 JSON으로 응답한다.

## 먼저 확인할 신호

로그인이 실패했을 때 가장 먼저 볼 것은 브라우저 에러 문구보다 네트워크 흐름이다. 로그인 완료 후 `POST /api/auth/session`이 보이면 앱 코드까지 정상 복귀한 상태다. 이 요청이 전혀 보이지 않으면 OAuth 설정, redirect helper, service worker, 브라우저 저장소 중 하나가 복귀 전에 막고 있는 것이다.

`/__/auth/handler`를 주소창에 직접 열었을 때 나오는 `Unable to process request due to missing initial state`는 실패 신호가 아니다. 이 경로는 redirect 로그인 도중에만 의미가 있고, 직접 접속하면 초기 state가 없어서 저 메시지가 뜨는 것이 정상이다. 수동 점검은 항상 `__/firebase/init.json`과 실제 로그인 왕복 기준으로 해야 한다.

## 도메인과 환경 변수

Vercel 프로젝트의 실제 도메인과 `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`은 반드시 같아야 한다. 현재 값은 `petroutine-ielc.vercel.app`이어야 하고, 예전 Firebase Hosting 기본값인 `petroutine-2b8fd.firebaseapp.com`으로 되돌리면 redirect helper가 cross-site로 동작해 브라우저 저장소 정책과 다시 충돌한다. 로컬 개발에서는 별도 환경값을 쓸 수 있지만, 배포 환경에서는 앱이 실제로 열리는 도메인을 기준으로 맞춰야 한다.

`https://petroutine-ielc.vercel.app/__/firebase/init.json`을 열었을 때 JSON이 내려와야 하고, 그 안의 `authDomain` 값도 `petroutine-ielc.vercel.app` 이어야 한다. 여기서 404가 나거나 다른 도메인이 내려오면 배포 env 또는 rewrite 구성이 틀린 것이다.

## Firebase Console 확인

Firebase Console `Authentication > Settings > Authorized domains`에는 `petroutine-ielc.vercel.app`가 있어야 한다. 이 설정은 도메인 단위 허용이고, redirect URI 자체를 대신 등록해주지는 않는다. `localhost`와 Firebase 기본 도메인이 같이 있어도 앱 도메인이 빠져 있으면 현재 배포에서는 로그인 복귀가 막힌다.

Google provider는 `Authentication > Sign-in method > Google` 에서 활성화되어 있어야 한다. 이 단계는 이미 켜져 있었지만, provider가 꺼져 있으면 이후 단계와 무관하게 로그인 버튼이 실패한다.

## Google OAuth 클라이언트 확인

Google Cloud Console의 `OAuth 2.0 Client ID`에는 브라우저 origin과 redirect URI가 둘 다 들어 있어야 한다. 현재 기준으로 `Authorized JavaScript origins`에는 `https://petroutine-ielc.vercel.app`가 있어야 하고, `Authorized redirect URIs`에는 `https://petroutine-ielc.vercel.app/__/auth/handler`가 있어야 한다. 둘 중 하나라도 빠지면 `redirect_uri_mismatch` 또는 잘못된 요청 오류가 난다.

설정을 수정한 뒤에는 바로 반영되지 않을 수 있다. 저장 후 몇 분 정도 기다린 뒤 다시 시도해야 하고, 수정한 OAuth client가 실제로 사용되는 client인지도 확인해야 한다. 오류 페이지의 `오류 세부정보`에 보이는 `client_id`와 `redirect_uri`는 이 단계에서 가장 신뢰할 수 있는 진단 정보다.

## 미들웨어와 helper 경로

[`src/proxy.ts`](/home/faeqsu10/projects/petroutine/src/proxy.ts) 는 인증되지 않은 사용자를 `/welcome`으로 보내지만, `__/auth` 와 `__/firebase` 경로는 예외로 두어야 한다. 이 예외가 없으면 Firebase helper 요청이 로그인 전에 `/welcome`으로 리다이렉트되고, 앱은 redirect 결과를 복구할 기회조차 얻지 못한다. 관련 회귀 테스트는 [`src/proxy.test.ts`](/home/faeqsu10/projects/petroutine/src/proxy.test.ts) 에 들어 있다.

이 프로젝트는 Next 16의 권장 규칙에 맞춰 `proxy.ts`를 사용한다. 이전 `middleware.ts`와 역할은 같고, 인증 예외 경로와 세션 기반 리다이렉트 정책도 그대로 유지한다.

## Service Worker와 브라우저 상태

PWA service worker는 인증과 관계없는 GET 요청만 캐시해야 한다. 현재 [`public/sw.js`](/home/faeqsu10/projects/petroutine/public/sw.js) 는 `__/`, `/login`, `/signup`, `/welcome`, `/auth/` 경로를 우회하도록 되어 있다. 이 예외가 없으면 오래된 로그인 페이지나 helper 응답이 캐시되어 redirect state 복구가 불안정해질 수 있다.

이미 잘못된 service worker나 캐시가 남아 있는 브라우저에서는 설정을 고쳐도 증상이 계속될 수 있다. 그럴 때는 DevTools `Application` 탭에서 service worker를 `Unregister` 하고, `Clear site data`를 실행한 뒤 새 시크릿 창에서 다시 로그인해야 한다. 확장 프로그램이 페이지 저장소를 건드리는 환경이라면 확장도 잠시 끄는 편이 낫다.

## 배포 실패가 로그인과 무관하게 발생할 때

Vercel 배포 실패는 로그인 설정과 별개일 수 있다. 이 프로젝트에서는 Cloud Functions 소스가 루트 `tsconfig.json`에 포함되어 Next build가 `functions/src`까지 타입 체크하면서 실패한 적이 있었다. [`tsconfig.json`](/home/faeqsu10/projects/petroutine/tsconfig.json) 에서 `functions/`를 `exclude` 해야 Next 앱 빌드와 Functions 빌드가 분리된다.

배포가 실패하면 로그인 디버깅 전에 먼저 `next build`가 통과하는지 확인해야 한다. 배포가 깨진 상태에서는 새 env, 새 rewrite, 새 service worker 중 무엇도 반영되지 않는다.

## 실제 점검 순서

문제가 다시 생기면 먼저 `https://petroutine-ielc.vercel.app/__/firebase/init.json`을 열어 JSON과 `authDomain`을 확인한다. 그 다음 Google Cloud의 JavaScript origin과 redirect URI가 앱 도메인 기준으로 등록되어 있는지 본다. 이어서 실제 로그인 후 네트워크 탭에 `POST /api/auth/session`이 찍히는지 확인한다. 마지막으로 service worker와 site data를 지우고 다시 시도하면, 설정 문제와 브라우저 상태 문제를 빠르게 분리할 수 있다.
