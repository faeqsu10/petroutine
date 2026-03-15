# Petroutine 기술 스택 (Tech Stack)

> **문서 버전:** v1.0
> **작성일:** 2026-03-13
> **작성자:** System Architect Agent
> **상태:** Approved

---

## 1. 기술 스택 요약

```
┌─────────────────────────────────────────────────────┐
│                     Frontend                         │
│  Next.js 15 (App Router) + TypeScript (strict)       │
│  Tailwind CSS v4 + shadcn/ui                         │
│  Zustand (클라이언트 상태) + TanStack Query (서버 상태) │
│  PWA (Serwist/next-pwa) + Service Worker             │
├─────────────────────────────────────────────────────┤
│                     Backend                          │
│  Firebase (Firestore + Auth + Session Cookies)       │
│  Firebase Admin SDK (Server-side verification)       │
│  FCM + Web Push API (Push Notifications)             │
├─────────────────────────────────────────────────────┤
│                    Deployment                        │
│  Vercel (Frontend) + Firebase (Backend)              │
│  GitHub Actions (CI/CD)                              │
├─────────────────────────────────────────────────────┤
│                     Testing                          │
│  Vitest + React Testing Library                      │
│  Playwright (E2E, 선택적)                             │
└─────────────────────────────────────────────────────┘
```

---

## 2. 선정 근거 상세

### 2.1 Next.js 15 (App Router, PWA)

**역할:** 프론트엔드 프레임워크 + 모바일 앱 대체 (PWA)

**선정 근거:**

| 기준 | Next.js (PWA) | React Native | Flutter |
|------|---------------|--------------|---------|
| 1인 개발 속도 | ★★★★★ | ★★★ | ★★★ |
| 웹 + 모바일 동시 | ★★★★★ | ★★ | ★★★ |
| Push 알림 | ★★★★ | ★★★★★ | ★★★★★ |
| 배포 용이성 | ★★★★★ | ★★ | ★★ |
| 학습 곡선 | ★★★★★ | ★★★★ | ★★★ |

- **1인 개발에서 가장 빠른 선택지**: 웹 기술(React/HTML/CSS)만으로 모바일 + 웹 동시 커버
- **스토어 심사 없이 즉시 배포**: Vercel에 push하면 수 분 내 배포 완료. MVP 반복 속도 극대화
- **App Router**: Server Components, Streaming, Parallel Routes 등 최신 패턴으로 성능 최적화
- **PWA 지원**: Service Worker 기반 오프라인 동작 + 홈 화면 추가 + Web Push API
- **iOS PWA 푸시**: iOS 16.4+부터 PWA에서 Push Notification 지원 (한국 iPhone 사용자 대부분 해당)
- **v2 전환 경로**: React Native (Expo)로 네이티브 앱 전환 시 React 코드/로직 재사용 가능

**고려한 대안:**

| 대안 | 선택하지 않은 이유 |
|------|-------------------|
| React Native (Expo) | 네이티브 앱이나, 스토어 심사에 1~2주 소요. 웹 접근 불가. 1인 개발에 비용 큼 |
| Flutter | Dart 학습 필요, 웹 지원 미성숙, React 생태계와 단절 |
| Remix | Next.js 대비 생태계 작음, PWA 지원 약함 |
| Nuxt (Vue) | React 생태계 대비 한국 개발자 풀 작음, shadcn/ui 미지원 |

**트레이드오프:**

| 장점 | 단점 |
|------|------|
| 배포/반복 속도 최고 | 네이티브 대비 UX 한계 (제스처, 애니메이션) |
| 웹 + 모바일 동시 커버 | iOS PWA 일부 제약 (백그라운드 실행 제한) |
| SEO 가능 (SSR) | 네이티브 기기 기능 접근 제한 (NFC, 블루투스 등 — 본 서비스에 불필요) |
| 무료 배포 (Vercel) | iOS 구버전(16.4 미만) 푸시 알림 미지원 |

**리스크 대응:**
- iOS PWA 제한 → iOS 16.4 미만 사용자에게는 인앱 배너로 알림 대체
- 네이티브 UX 요구 증가 시 → v2에서 Expo 전환 계획 수립

---

### 2.2 TypeScript (Strict Mode)

**역할:** 타입 안전성 보장, 개발 생산성 향상

**선정 근거:**
- **Firestore 타입 정의**: `src/types/database.ts`에서 Firestore 문서 타입을 수동 정의 → API 호출 시 타입 안전성 보장
- **strict mode**: `noImplicitAny`, `strictNullChecks` 등 활성화로 런타임 에러 사전 방지
- **Zod 연동**: API 요청/응답 유효성 검증 스키마에서 TypeScript 타입 자동 추론
- **IDE 지원**: 자동완성, 리팩토링, 에러 조기 발견

**고려한 대안:**

| 대안 | 선택하지 않은 이유 |
|------|-------------------|
| JavaScript | 타입 안전성 없음, 1인 개발에서 버그 추적 비용 증가 |
| Flow | 생태계 작음, TypeScript가 사실상 표준 |

**트레이드오프:**
- 초기 설정 비용 있지만, 중장기적으로 디버깅/리팩토링 시간 절약이 훨씬 큼
- Firestore 문서 타입 수동 관리 필요하나, 프로젝트 규모에서 충분히 관리 가능

---

### 2.3 Tailwind CSS 4

**역할:** 스타일링 시스템

**선정 근거:**
- **shadcn/ui와 공식 조합**: shadcn/ui 컴포넌트가 Tailwind 기반으로 설계됨
- **Utility-first**: 별도 CSS 파일 없이 컴포넌트 내에서 스타일 완결 → 1인 개발에 최적
- **v4 성능**: Oxide 엔진 도입으로 빌드 속도 10배 향상, CSS 번들 크기 감소
- **반응형/다크 모드**: `md:`, `dark:` 프리픽스로 반응형 + 다크 모드 즉시 구현
- **디자인 토큰**: `tailwind.config`에서 색상/간격/폰트 일관되게 관리

**고려한 대안:**

| 대안 | 선택하지 않은 이유 |
|------|-------------------|
| CSS Modules | 파일 분리 필요, 동적 스타일 불편 |
| styled-components | 런타임 오버헤드, Server Components 호환 이슈 |
| Emotion | styled-components와 동일 이슈 |
| Panda CSS | 생태계 작음, shadcn/ui 미지원 |
| Vanilla Extract | 학습 곡선 높음, 빌드 설정 복잡 |

**트레이드오프:**
- HTML이 다소 verbose해짐 → 컴포넌트 추출로 해결
- 디자이너 협업 시 클래스명 학습 필요 → 현재 1인 개발이므로 문제 없음

---

### 2.4 Firebase (Firestore + Auth + Session Cookies)

**역할:** Backend-as-a-Service (올인원 백엔드)

> **변경 이력:** 초기 설계는 Supabase(PostgreSQL)였으나, 운영 편의성과 한국 리전 지원을 고려하여 Firebase로 마이그레이션함.

**선정 근거:**

| 기준 | Firebase | Supabase | Custom Node.js |
|------|----------|----------|----------------|
| 개발 속도 | ★★★★★ | ★★★★★ | ★★★ |
| Auth 내장 | ★★★★★ | ★★★★★ | ✗ |
| 보안 규칙 | ★★★★ | ★★★★★ | ★★★ |
| 한국 리전 | ★★★★★ | ★★ | ★★★★ |
| NoSQL 유연성 | ★★★★ | ★★ | ★★★★ |

- **Firestore**: top-level 컬렉션 + userId 필드로 소유권 관리. 클라이언트에서 SDK 직접 호출
- **Firebase Auth**: Google OAuth (signInWithRedirect) + 세션 쿠키 방식 SSR 인증
- **보안 규칙**: `firestore.rules`에서 userId 기반 접근 제어
- **무료 티어**: Spark plan — 50K reads/day, 20K writes/day, 1GB Storage → MVP 충분
- **한국 리전**: asia-northeast3 (서울) 사용 가능

**데이터 모델:**
- top-level 컬렉션: `users`, `pets`, `careItems`, `careLogs`, `careSchedules`, `expenses`, `expenseCategories`
- 각 문서에 `userId` 필드로 소유권 표시
- `writeBatch`로 원자적 쓰기 (케어 완료, 항목 생성)

**인증 방식:**
- 클라이언트: `signInWithRedirect` → ID Token 획득
- 서버: `/api/auth/session` → `adminAuth.createSessionCookie()` → `__session` 쿠키 설정 (5일 만료)
- 미들웨어: `__session` 쿠키 존재 확인으로 라우트 보호

**트레이드오프:**

| 장점 | 단점 |
|------|------|
| 한국 리전 (서울) 지원 | NoSQL — 복잡한 JOIN 쿼리 클라이언트에서 처리 |
| 올인원 (Auth + DB + Storage + FCM) | Firestore `in` 연산자 30개 제한 |
| 무료 티어 넉넉 | 벤더 종속도 높음 |
| FCM 네이티브 통합 | Kakao OAuth 미지원 (Custom Auth 필요) |

**리스크 대응:**
- 복잡한 집계 쿼리 → 클라이언트에서 병렬 쿼리 + 메모리 집계 (MVP 데이터 규모에서 충분)
- Kakao OAuth → v2에서 Firebase Custom Auth + Kakao SDK로 구현 예정
- `in` 연산자 제한 → MVP 규모(반려동물 1~5마리)에서 30개 초과 불가능

---

### 2.5 Zustand + TanStack Query

**역할:** 상태 관리 (클라이언트 + 서버 상태 분리)

**선정 근거:**

- **Zustand (클라이언트 상태)**: UI 상태, 활성 반려동물 선택, 오프라인 완료 큐 관리
  - 1KB 번들 크기
  - 보일러플레이트 최소
  - `persist` 미들웨어로 localStorage 자동 저장 → 오프라인 큐 구현
- **TanStack Query (서버 상태)**: API 데이터 캐싱, 자동 갱신, Optimistic Updates
  - `optimistic updates`로 완료 버튼 즉시 UI 반영 (서버 응답 전)
  - `invalidateQueries`로 관련 데이터 자동 갱신 (대시보드, 목록 등)
  - 자동 재시도, 에러 핸들링, 로딩 상태 관리

**고려한 대안:**

| 대안 | 선택하지 않은 이유 |
|------|-------------------|
| Redux Toolkit | 보일러플레이트 과다, 학습 곡선 높음. 소규모 앱에 오버엔지니어링 |
| React Context | 리렌더링 성능 이슈, persist/미들웨어 기능 없음 |
| Jotai/Recoil | 서버 상태 관리 별도 필요. Zustand이 더 직관적 |
| SWR | TanStack Query 대비 기능 부족 (optimistic updates, devtools) |

**트레이드오프:**
- 두 라이브러리 학습 필요 → 역할이 명확히 분리되어 오히려 이해하기 쉬움
- TanStack Query 캐시 무효화 전략 설계 필요 → 케어 완료 시 dashboard/care-items 쿼리 자동 무효화로 해결

---

### 2.6 FCM + Web Push API

**역할:** Push 알림 발송 시스템

**선정 근거:**
- **FCM (Firebase Cloud Messaging)**: 웹 + 모바일(v2 네이티브) 모두 커버하는 업계 표준
- **Web Push API**: PWA에서 푸시 알림 수신을 위한 브라우저 표준 API
- **무료**: 발송량 제한 없음
- **Firebase Cloud Functions 연동**: Cloud Functions에서 FCM HTTP v1 API 호출로 알림 발송
- **v2 재사용**: React Native 전환 시 FCM 그대로 사용 가능

**고려한 대안:**

| 대안 | 선택하지 않은 이유 |
|------|-------------------|
| OneSignal | 무료 티어 제한, 추가 의존성 |
| Web Push만 (FCM 없이) | iOS Safari에서 안정성 부족 |
| Supabase Realtime | 앱이 열려있을 때만 동작, 진정한 Push 알림 아님 |

**트레이드오프:**
- Firebase 프로젝트에서 FCM + Firestore + Auth 통합 사용
- Service Worker 구현 필요 → next-pwa(Serwist)가 기본 제공

---

### 2.7 Vercel 배포

**역할:** 프론트엔드 호스팅 + CDN + CI/CD

**선정 근거:**
- **Next.js 공식 배포 플랫폼**: 빌드/배포 최적화 (ISR, Edge Runtime 자동 지원)
- **무료 티어**: 100GB bandwidth, Serverless Functions, Analytics 포함
- **자동화**: Git push → 빌드 → 배포 (Preview + Production)
- **Edge Network**: 전 세계 CDN으로 한국 사용자에게 빠른 응답
- **HTTPS/도메인**: 무료 SSL 인증서, 커스텀 도메인 연결

**고려한 대안:**

| 대안 | 선택하지 않은 이유 |
|------|-------------------|
| Netlify | Next.js 호환성 Vercel 대비 부족 |
| AWS Amplify | 설정 복잡, 무료 티어 제한적 |
| Self-hosted | 인프라 관리 부담, 1인 개발에 부적합 |
| Cloudflare Pages | Next.js App Router 호환성 불완전 |

**트레이드오프:**
- Vercel Pro 전환 시 월 $20 (트래픽 증가 시)
- 서버리스 제한 (장시간 실행 불가) → 긴 작업은 Firebase Cloud Functions에서 처리

---

### 2.8 Vitest (테스팅)

**역할:** 단위 테스트 + 통합 테스트 프레임워크

**선정 근거:**
- **Vite 기반**: 빠른 테스트 실행 속도 (Jest 대비 2~5배)
- **ESM 네이티브**: Next.js 15 + TypeScript와 호환성 우수
- **Jest 호환 API**: `describe`, `it`, `expect` 동일 API → 학습 비용 제로
- **React Testing Library 통합**: 컴포넌트 테스트에 활용
- **Watch 모드**: 파일 변경 시 관련 테스트만 즉시 재실행

**고려한 대안:**

| 대안 | 선택하지 않은 이유 |
|------|-------------------|
| Jest | ESM 지원 불완전, 설정 복잡, 실행 속도 느림 |
| Bun Test | 생태계 미성숙, React Testing Library 호환 불확실 |
| Playwright (E2E only) | 단위 테스트 프레임워크가 아님. E2E 보완용으로 선택적 사용 |

**테스트 전략:**
- **단위 테스트**: 주기 계산 엔진, 날짜 유틸, 포맷 함수 → Vitest
- **컴포넌트 테스트**: CareCard, CompleteButton, ExpenseForm → Vitest + React Testing Library
- **API 통합 테스트**: Edge Functions 입출력 검증 → Vitest
- **E2E 테스트**: 핵심 플로우(회원가입 → 펫 등록 → 케어 완료) → Playwright (Phase F에서 선택적)

---

## 3. 추가 라이브러리

| 용도 | 라이브러리 | 선정 근거 |
|------|-----------|-----------|
| UI 컴포넌트 | shadcn/ui | 커스터마이징 자유도 높음, 접근성(a11y) 기본 준수, 복사-붙여넣기 방식으로 번들 최적화 |
| 폼 관리 | React Hook Form + Zod | 타입 안전 유효성 검사, 최소 리렌더링, Firestore 타입과 Zod 스키마 연동 |
| 날짜 처리 | date-fns | 트리 셰이킹 지원(필요한 함수만 임포트), 한국어 locale 지원, 주기 계산에 필수 |
| 차트 | Recharts | React 네이티브 차트 라이브러리, 지출 통계 파이/바 차트 구현 |
| PWA | Serwist (next-pwa 후속) | Next.js App Router 공식 호환, Service Worker 자동 생성 |
| 아이콘 | Lucide React | shadcn/ui 기본 아이콘 세트, 트리 셰이킹 지원 |
| 입력 검증 | Zod | TypeScript 네이티브, React Hook Form 통합, API 요청/응답 검증 |

---

## 4. 비용 분석 (MVP 운영)

| 서비스 | 무료 티어 | 예상 사용량 (MVP) | 월 비용 |
|--------|-----------|-------------------|---------|
| Vercel | 100GB bandwidth, Serverless Functions | 10GB | $0 |
| Firebase (Spark) | 1GB Firestore, 5GB Storage, 무제한 Auth | 50MB Firestore, 1K MAU | $0 |
| Firebase (FCM) | 무제한 | ~1,000건/일 | $0 |
| GitHub | 무료 (public/private) | CI/CD 2,000분/월 | $0 |
| 도메인 | - | petroutine.app | ~$12/년 |
| **합계** | | | **~$1/월** |

---

## 5. 기술 결정 원칙

1. **MVP 속도 우선**: 완벽한 기술보다 빠른 출시가 중요. 오버엔지니어링 경계
2. **1인 개발 최적화**: 관리 포인트를 최소화하는 매니지드 서비스 선호
3. **이관 용이성**: 벤더 종속 최소화. 표준 기술(SQL, React, TypeScript) 기반
4. **v2 확장 경로 확보**: 현재 결정이 향후 네이티브 앱, 가족 공유, AI 기능 도입에 장애가 되지 않도록 설계
5. **한국 시장 맞춤**: Kakao 로그인 우선, KST 시간대 기본, 원화(KRW) 기준 금액

---

> **문서 끝**
>
> 이 문서는 Petroutine MVP의 모든 기술 결정의 근거를 담고 있으며,
> 새로운 기술 도입 시 이 문서를 업데이트할 것.
