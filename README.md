# Petroutine 🐾

반려동물 케어 주기 관리 + 지출 관리 앱

> "기억에 의존하지 않는 반려동물 관리 시스템" — 최소 입력으로 굴러가는 반자동 케어 루프

## 주요 기능

- **케어 주기 관리**: 목욕, 예방접종, 미용 등 케어 항목 등록 → 완료 버튼 1번 → 다음 일정 자동 생성
- **지출 관리**: 반려동물별 지출 기록 + 월별 통계 (카테고리별, 반려동물별)
- **멀티 반려동물**: 여러 반려동물을 각각 관리
- **PWA**: 모바일 홈 화면에 추가하여 앱처럼 사용

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 + React 19 + TypeScript 5 |
| 백엔드 | Firebase (Firestore + Auth) |
| 상태 관리 | TanStack React Query + Zustand |
| UI | shadcn/ui + Tailwind CSS |
| 테스트 | Vitest + Testing Library |
| 패키지 매니저 | npm |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test

# 프로덕션 빌드
npm run build
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
├── components/       # UI 컴포넌트 (shadcn/ui 기반)
├── hooks/            # TanStack Query 훅 (CRUD 로직)
├── stores/           # Zustand 스토어
├── lib/              # Firebase 클라이언트, 유틸리티
└── types/            # TypeScript 타입 정의
docs/                 # PRD, API 명세, ERD 등 문서
tasks/                # TODO, 교훈 기록
scripts/              # 시딩 스크립트
```

## 환경 변수

`.env.local` 파일에 Firebase 설정이 필요합니다:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```
