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

## Phase 5: 보안/성능 수정 + 테스트 확대
- **날짜**: 2026-03-14
- **커밋**: `e79783e`, `d9eaeae`
- **작업**: Phase 4 검증 이슈 수정, 엣지 케이스 테스트 추가, timezone 버그 수정
- **산출물**:
  - `src/lib/utils.ts` — `toLocalDateStr()` 유틸 추가 (UTC timezone 버그 수정)
  - Zustand 셀렉터 최적화 (전체 스토어 구독 → 개별 셀렉터)
  - Zod 스키마 `.max()` 제한 추가 (XSS/DoS 방지)
  - `documentId()` 사용으로 Firestore 내부 필드 참조 제거
  - 150개 → 194개 테스트

## Phase 5.5: 랜딩 페이지 + 프리미엄 UI 리디자인
- **날짜**: 2026-03-14
- **커밋**: `bf5a4e4`, `9efbb3e`, `85ca632`, `68b39f3`
- **작업**: 로그인 월 UX 해결, 전체 UI 프리미엄 리디자인
- **산출물**:
  - `src/app/(public)/welcome/page.tsx` — 랜딩/웰컴 페이지 (framer-motion 애니메이션)
  - `src/middleware.ts` — 미인증 사용자 `/welcome`으로 리다이렉트
  - 디자인 시스템: HSL → oklch 컬러, 코랄 피치(#FF7E5F) 테마
  - Pretendard 웹폰트, 플로팅 pill 네비게이션
  - 로그인 페이지 디자인 통일
  - PWA 아이콘 생성 (icon-192.png, icon-512.png)

## Phase 5.6: 테스트 커버리지 확대
- **날짜**: 2026-03-14
- **커밋**: `367c933`
- **작업**: 미테스트 영역 전수 테스트 작성
- **산출물**:
  - 10개 신규 테스트 파일, 80개 테스트 추가 (209개 → 289개)
  - 훅: use-create-care-item (16), use-expense-categories (9)
  - 컴포넌트: complete-modal (7), bottom-nav (6)
  - 페이지: 대시보드 (6), 케어 (8), 지출 (8), 설정 (6), 반려동물 등록 (6), 로그인 (5)

## Phase 5.7: Firestore 쿼리 버그 수정 + 전체 기능 감사
- **날짜**: 2026-03-14
- **커밋**: `c70ac86`, `bd681ed`, `d08bb80`
- **작업**: 케어 항목 조회 불가 버그 근본 해결, 전체 앱 기능 감사 및 수정
- **버그 수정**:
  - `useCareItems` — Firestore 쿼리에 `userId` 필터 누락 → PERMISSION_DENIED (React Query가 삼킴)
  - `useExpenseCategories` — 기본 카테고리 쿼리 동일 패턴 선제 수정
  - Firestore 복합 인덱스 userId 포함 업데이트 + 재배포
- **전체 기능 감사 수정**:
  - 대시보드: ₩245,000 하드코딩 → `useMonthlyStats` 실제 데이터 연동
  - 대시보드: 알림 벨 버튼 제거 (onClick 없이 빨간 도트 → 사용자 오도)
  - 대시보드: 체중 하드코딩 → 실제 pet weightKg 표시, 컨디션 카드 제거
  - 설정: "알림 설정", "프로필 편집" → "(준비 중)" 비활성 표시
  - 케어 추가: 스마트 알림 문구 → "알림 기능은 준비 중이에요"
  - 에러 핸들링: 모든 mutation에 onError 콜백 추가 (케어 완료/수정/삭제, 지출 추가/수정/삭제)
- **검증**: 289개 테스트 통과, 빌드 성공, 아키텍트 APPROVED
- **교훈**: Firestore isOwner() 규칙 → 쿼리에 반드시 userId 필터 포함 (tasks/lessons.md 기록)

## Phase 5.8: 코드 품질 리뷰 + 수정
- **날짜**: 2026-03-14
- **커밋**: `c60f08c`, `dbf9724`, `aa46803`
- **작업**: 코드 품질 전수 리뷰 후 발견 이슈 수정
- **수정 사항**:
  - Dead code 제거: offlineQueue 관련 코드/테스트 삭제
  - Firestore `in` 쿼리 30개 제한 방어: `chunkArray` 유틸 추가
  - 쿼리 에러 UI: 대시보드, 케어, 지출, 설정 4개 페이지에 isError 분기 추가
  - mutateAsync unhandled rejection: pets/add, pets/edit에 try/catch 추가
  - deletePet onError 콜백 추가
  - PRESET_COLORS 불일치 수정 (등록/수정 통일)
  - 홈 인사말 `pets[0]` → `activePet` 수정
  - 로그아웃 에러 핸들링 추가
  - 말줄임표 `...` → `…` 유니코드 통일
  - viewport maximumScale/userScalable 제거 (접근성 개선)
- **검증**: 280개 테스트 통과, 빌드 성공

## Phase 6: PRD 미구현 기능 구현
- **날짜**: 2026-03-14
- **커밋**: `d7e90d9`, `6f1c339`
- **작업**: PRD vs 구현 Gap 분석 후 미구현 기능 일괄 구현
- **신규 기능**:
  - 케어 기본 템플릿 15개 선택 UI (위생 5, 건강 5, 생활 5)
  - 주기 수정 시 careSchedule nextDueDate 자동 재계산 (writeBatch)
  - 완료 모달 소급 입력 (과거 날짜 선택 가능)
  - Toast 피드백 시스템 (sonner)
  - 대시보드 다가오는 일정 7일 이내 필터
  - 지출 통계 카테고리별 비율(%) 표시
  - 반려동물 삭제 cascade (연결된 careItems/schedules 비활성화)
  - 커스텀 지출 카테고리 추가 UI + useCreateExpenseCategory 훅
  - 재로그인/새로고침 시 데이터 유지 (onAuthStateChanged 리스너)
- **버그 수정**:
  - 지출 금액 입력 필드 숫자 안 보이는 문제 (text-white 명시)
  - auth.currentUser null → onAuthStateChanged로 auth 초기화 대기
- **검증**: 282개 테스트 통과, 빌드 성공

## Phase 6.5: MVP 마무리 기능
- **날짜**: 2026-03-14
- **커밋**: `0d9bcf2`, `7f3b784`, `514bac5`
- **작업**: Toast 피드백, 전체 보기, 가계부 강화, 완료 되돌리기, 공통 지출
- **신규 기능**:
  - Toast 피드백: 모든 CRUD 액션에 sonner toast, alert→toast.error 전환
  - 전체 보기 탭: 대시보드/케어에 "전체" 탭 추가
  - 가계부: 반려동물 필터, 전월 대비 증감, 카테고리 클릭 필터
  - 완료 되돌리기: toast "되돌리기" 버튼 5초, writeBatch 원자적 복원
  - 공통 지출: petId 없이 전체 공통 지출 기록
  - 대시보드 최근 완료: 최근 3개 완료 항목 표시
  - 엣지 케이스 테스트 +22개 (282→304개)
- **검증**: 304개 테스트 통과, 빌드 성공

## Phase 7: v1.1 기능
- **날짜**: 2026-03-14
- **커밋**: `93b997f`
- **작업**: 온보딩 플로우 + 반려동물 아바타 업로드
- **신규 기능**:
  - 온보딩: 3단계 플로우 (환영 → 반려동물 등록 → 케어 항목 선택)
  - 아바타: Firebase Storage 연동, pets/add 사진 업로드 UI
  - next.config: 이미지 도메인 설정
- **검증**: 304개 테스트 통과, 빌드 성공
