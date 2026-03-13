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
