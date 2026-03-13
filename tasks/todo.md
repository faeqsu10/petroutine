# Petroutine - TODO

## Phase 0: 프로젝트 셋업
- [x] 에이전트 팀 구성 (agents/ 디렉토리)
- [x] CLAUDE.md 작성
- [x] Git 레포 초기 커밋
- [x] 기술 스택 결정

## Phase 1: 기획
- [x] PRD 작성 (docs/PRD.md)
- [x] 유저 스토리 정의 (docs/PRD.md 내 포함)
- [x] 유저 플로우 설계 (docs/user-flows.md)
- [x] 와이어프레임 작성 (docs/wireframes.md)

## Phase 2: 설계
- [x] 기술 스택 결정 (docs/tech-stack.md)
- [x] DB 스키마 설계 - ERD (docs/erd.md, supabase/migrations/)
- [x] API 명세 작성 (docs/api-spec.md)
- [x] 시스템 아키텍처 (.omc/autopilot/spec.md)

## Phase 3: 구현 (MVP) — UI 기능 구현 완료
- [x] 프로젝트 초기화 + 보일러플레이트
- [x] 타입 시스템 (src/types/)
- [x] Supabase 클라이언트 (src/lib/supabase/)
- [x] 유틸리티 함수 (src/lib/utils.ts)
- [x] TanStack Query 훅 (src/hooks/)
- [x] Zustand 스토어 (src/stores/)
- [x] 레이아웃 + 내비게이션 (src/components/layout/)
- [x] 페이지 스캐폴드 (홈/케어/가계부/설정/로그인)
- [x] shadcn/ui 초기화 + UI 컴포넌트 (12개)
- [x] 반려동물 프로필 등록 UI (pets/add)
- [x] 케어 항목 추가 UI (care/add)
- [x] 완료 체크 모달 (CompleteModal)
- [x] 홈 대시보드 완성 (완료 버튼 + 모달 연동)
- [x] 지출 기록 추가 UI (expenses/add)
- [x] 월별 지출 통계 + 월 네비게이션
- [x] 설정 페이지 (반려동물 목록, 앱 설정)
- [x] OAuth 콜백 라우트 (auth/callback)
- [x] PWA manifest.json
- [ ] 푸시 알림 (FCM) — Phase 2로 이관

## Phase 4: 검증
- [ ] 단위 테스트 (QA 에이전트)
- [ ] 통합 테스트 (QA 에이전트)
- [ ] 보안 점검 (QA 에이전트)
- [ ] 성능 검증 (QA 에이전트)
