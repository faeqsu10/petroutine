# Petroutine - Development Log

## Phase 0: 프로젝트 셋업
- **날짜**: 2026-03-13
- **커밋**: `caabf66`
- **작업**: 에이전트 팀 구성, CLAUDE.md 작성, 프로젝트 구조 초기화
- **산출물**:
  - `CLAUDE.md` — 프로젝트 규칙 및 워크플로우
  - `agents/` — 6명의 전문가 에이전트 정의 (PM, UX Designer, Architect, Frontend, Backend, QA)
  - `tasks/todo.md` — 초기 할일 목록
  - `tasks/lessons.md` — 교훈 기록 시작

## Phase 1-2: 기획 + 설계
- **날짜**: 2026-03-13
- **커밋**: `e2b1fb0`
- **작업**: PRD, 유저플로우, 와이어프레임, 기술스택, ERD, API 명세, 프로젝트 스캐폴드
- **산출물**:
  - `docs/PRD.md` — 제품 요구사항 문서 (페르소나, 유저스토리, MVP 스코프)
  - `docs/user-flows.md` — 전체 유저 플로우 다이어그램
  - `docs/wireframes.md` — 12개 MVP 화면 ASCII 와이어프레임
  - `docs/tech-stack.md` — 기술 스택 비교 분석 및 결정
  - `docs/erd.md` — DB 스키마 문서
  - `docs/api-spec.md` — API 명세서
  - `supabase/migrations/001_initial_schema.sql` — DDL (8 테이블, RLS, 트리거)
  - `src/types/` — Database 타입 + 도메인 타입
  - `src/lib/` — Supabase 클라이언트, 미들웨어, 유틸리티
  - `src/hooks/` — TanStack Query 훅 (pets, care-items, expenses)
  - `src/stores/` — Zustand 스토어
  - `src/components/layout/` — BottomNav, Providers
  - `src/app/` — 페이지 스캐폴드 (홈, 케어, 가계부, 설정, 로그인)
- **기술 결정**:
  - Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui
  - Supabase (PostgreSQL + Auth + RLS + Edge Functions)
  - TanStack Query + Zustand
  - PWA + FCM
- **비고**: 빌드 성공 확인 완료. Supabase placeholder 환경변수 사용 중.

## Phase 3: MVP UI 구현
- **날짜**: 2026-03-13
- **커밋**: `96093ba`, `0190c90`
- **작업**: shadcn/ui 초기화, CRUD 폼 구현, 완료 모달, 에러 바운더리
- **산출물**:
  - `components.json` + `src/components/ui/` — shadcn/ui 12개 컴포넌트 (button, card, dialog, input, label, select, sheet, badge, skeleton, separator, textarea, form)
  - `src/app/(main)/pets/add/page.tsx` — 반려동물 등록 폼 (react-hook-form + zod)
  - `src/app/(main)/care/add/page.tsx` — 케어 항목 추가 폼 (카테고리/주기/아이콘/색상 선택)
  - `src/components/care/complete-modal.tsx` — 케어 완료 다이얼로그 (메모 입력)
  - `src/app/(main)/expenses/add/page.tsx` — 지출 등록 폼 (카테고리 그리드 선택)
  - `src/hooks/use-create-care-item.ts` — 케어 항목 생성 mutation
  - `src/hooks/use-expense-categories.ts` — 지출 카테고리 조회 hook
  - `src/app/auth/callback/route.ts` — OAuth 콜백 핸들러
  - `src/app/error.tsx`, `src/app/(main)/error.tsx` — 에러 바운더리
  - `public/manifest.json` — PWA 매니페스트
- **Architect 검증**: 전체 PASS
  - 구조/타입/데이터레이어/UI/보안 모두 통과
  - MEDIUM 이슈 3건 수정 완료 (에러 바운더리, 날짜 범위 버그, pet auto-select)
- **비고**: 총 13개 라우트 빌드 성공. Supabase 연결 시 즉시 사용 가능 상태.

## Phase 3.5: CRUD 완성 + 카테고리 시딩
- **날짜**: 2026-03-13
- **커밋**: `30cebdd`
- **작업**: Update/Delete CRUD 훅, 수정/삭제 UI, 기본 지출 카테고리 시딩
- **산출물**:
  - `scripts/seed-categories.ts` — 6개 기본 지출 카테고리 시딩 스크립트
  - `src/hooks/use-pets.ts` — +useUpdatePet, +useDeletePet (소프트 삭제: archivedAt)
  - `src/hooks/use-care-items.ts` — +useUpdateCareItem, +useDeleteCareItem (소프트 삭제: isActive=false)
  - `src/hooks/use-expenses.ts` — +useUpdateExpense, +useDeleteExpense (하드 삭제)
  - `src/app/(main)/pets/[id]/edit/page.tsx` — 반려동물 수정 페이지
  - `src/components/care/edit-sheet.tsx` — 케어 항목 수정 Sheet (이름, 주기, 아이콘, 색상)
  - `src/components/expenses/edit-sheet.tsx` — 지출 수정 Sheet (금액, 내용, 카테고리, 날짜)
  - `src/components/shared/confirm-dialog.tsx` — 삭제 확인 재사용 컴포넌트
- **기존 페이지 수정**:
  - `settings/page.tsx` — 반려동물 클릭 → `/pets/[id]/edit` 링크 추가
  - `care/page.tsx` — 케어 항목 클릭 → 수정 Sheet 열기
  - `expenses/page.tsx` — 지출 항목 클릭 → 수정 Sheet 열기
- **검증**: 빌드 성공, 70개 기존 테스트 통과, 카테고리 시딩 실행 완료

## Phase 4: Supabase → Firebase 마이그레이션
- **날짜**: 2026-03-13
- **커밋**: (pending)
- **작업**: 전체 백엔드를 Supabase에서 Firebase(Firestore + Firebase Auth)로 마이그레이션
- **산출물**:
  - `src/lib/firebase/config.ts` — Firebase 클라이언트 설정
  - `src/lib/firebase/client.ts` — Firebase 클라이언트 싱글턴 (auth, db)
  - `src/lib/firebase/admin.ts` — Firebase Admin SDK (Proxy 기반 lazy init)
  - `src/app/api/auth/session/route.ts` — 세션 쿠키 생성/삭제 API
  - `src/types/database.ts` — Firestore 문서 타입 (camelCase)
  - `firestore.rules` — Firestore 보안 규칙 (userId 기반 소유권 검증)
  - `firestore.indexes.json` — 복합 인덱스 정의 (7개)
  - `.env.local` / `.env.local.example` — Firebase 환경변수
- **변경 사항**:
  - 5개 데이터 훅 Firestore 쿼리로 전환 (use-pets, use-care-items, use-expenses, use-expense-categories, use-create-care-item)
  - 로그인: `signInWithPopup` + `GoogleAuthProvider` → 세션 쿠키 방식
  - 미들웨어: `__session` 쿠키 존재 확인
  - 케어 완료/생성: `writeBatch` 원자적 쓰기
  - Supabase 의존성 제거 (`@supabase/supabase-js`, `@supabase/ssr`)
  - `src/lib/supabase/` 디렉토리 삭제
- **Architect 검증**: CONDITIONAL PASS → 3건 수정 후 빌드 PASS
  - [CRITICAL] 로그인 에러 핸들링 (`response.ok` 체크 추가)
  - [HIGH] 지출 쿼리 constraint 순서 수정 (Firestore 인덱스 요구사항)
  - [MEDIUM] 케어 쓰기 원자성 (`writeBatch` 적용)
- **기술 결정**:
  - Firebase Auth (Google OAuth, 카카오는 추후 Custom Auth로)
  - Firestore NoSQL (top-level 컬렉션 + userId 필드)
  - 세션 쿠키 방식 SSR 인증 (5일 만료)
  - Admin SDK Proxy lazy init (빌드 시점 에러 방지)
- **비고**: 14개 라우트 빌드 성공. Supabase 참조 완전 제거.
