# Petroutine - TODO

## Phase 0~4: 완료 ✅
- [x] 프로젝트 셋업, 기획, 설계, MVP 구현, CRUD, 테스트/검증
- [x] Firebase 마이그레이션 (Supabase → Firestore + Auth)
- [x] Firestore 보안 규칙 + 복합 인덱스

## Phase 5~5.8: 완료 ✅
- [x] 보안/성능 수정 (timezone 버그, Zod max, Zustand 셀렉터)
- [x] 프리미엄 UI 리디자인 (코랄 피치 테마, Pretendard, 플로팅 네비)
- [x] 랜딩/웰컴 페이지 + 로그인 페이지 디자인 통일
- [x] 테스트 커버리지 확대 (209→304개)
- [x] Firestore 쿼리 userId 필터 버그 수정
- [x] 전체 기능 감사 + 하드코딩 제거 + 에러 핸들링 추가
- [x] 코드 품질 리뷰 (dead code 제거, chunkArray, 접근성)

## Phase 6~6.5: 완료 ✅
- [x] 케어 기본 템플릿 15개 선택 UI
- [x] 주기 수정 시 스케줄 자동 재계산
- [x] 완료 소급 입력 (날짜 선택)
- [x] Toast 피드백 시스템 (sonner)
- [x] 전체 보기 탭 (대시보드/케어)
- [x] 가계부 강화 (반려동물 필터, 전월 대비, 카테고리 드릴다운)
- [x] 완료 되돌리기 (5초 undo)
- [x] 공통 지출 (petId 없이 기록)
- [x] 대시보드 최근 완료 표시
- [x] 커스텀 지출 카테고리 추가 UI
- [x] 레이아웃 상수 중앙화 (BOTTOM_NAV_PADDING, PRESET_COLORS 등)

## Phase 7: v1.1 완료 ✅
- [x] 온보딩 3단계 플로우 (환영 → 반려동물 등록 → 케어 항목 선택)
- [x] 반려동물 아바타 업로드 (Firebase Storage)
- [x] 반려동물 삭제 cascade (연결된 careItems/schedules 비활성화)

## Phase 8: 버그 수정 + 안정화
- [x] Google 로그인 COOP 팝업 이슈 — signInWithPopup + catch fallback
- [x] Google 로그인 redirect 기반 전환 + 계정 선택 강제
- [x] 로그인 리다이렉트 루프 수정 (세션 생성 await 후 이동)
- [x] 로그인 이중 진입 방지 (로딩 스피너)
- [x] Firestore disjunction 30개 제한 초과 수정 (청크 10개)
- [x] 가계부 인덱스 추가 (expenses userId+expenseDate ASC)
- [x] 케어 전체 보기 인덱스 추가 (careItems userId+isActive)
- [x] 가계부 공통 지출(petId null) 통계 쿼리 실패 수정
- [x] 지출 금액 입력 bento-item CSS 충돌 수정
- [x] 웰컴 페이지 CTA 간격 조정 (fixed→일반 플로우)
- [x] 온보딩 중복 접근 방지
- [x] 케어/대시보드 기본 탭을 첫 번째 펫으로 변경
- [x] CLAUDE.md, todo.md, dev-log.md, lessons.md 현행화
- [x] 가계부/케어 디버그 에러 메시지 → 정상 UI 복원

## v2: 완료 ✅
- [x] PWA 기본 Service Worker (앱 설치 + 정적 자산 캐싱)
- [x] 프로필 편집 페이지
- [x] 알림 설정 페이지 (전체/항목별 ON/OFF + 시간 설정)
- [x] Push 알림 (FCM 클라이언트 + Cloud Functions 스케줄러)
- [x] Firebase Storage 보안 규칙
- [x] Google 로그인 안정화 (COOP + auth helper 프록시)

## Phase 9: 출시 준비 + 품질 개선
- [x] User 문서 자동 생성 (로그인 시 Firestore에 저장)
- [x] Analytics 연동 (GA4 — 사용자 행동 추적)
- [x] CI/CD 파이프라인 (GitHub Actions — 테스트/빌드 자동화)
- [x] 다크 모드 지원
- [ ] 앱 스토어 등록 준비 (TWA/PWA 최적화)

## v3 (향후)
- [ ] 카카오 로그인 (Firebase Custom Auth + Cloud Functions)
- [ ] 사료/용품 추천 (제휴 수익) — PRD v2
- [ ] 병원 연결/추천 (수수료 수익) — PRD v3
