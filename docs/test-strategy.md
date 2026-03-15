# Petroutine 테스트 전략

## 1. 철학: "테스트는 경쟁력의 해자(moat)"

테스트는 일회성 체크리스트가 아니라 **지속적으로 관리하는 자산**이다.
엣지 케이스를 꼼꼼히 다루는 테스트 스위트는 코드베이스의 신뢰성을 보장하고,
리팩토링과 기능 추가 시 안전망 역할을 한다.

### 핵심 원칙
- **새 기능 = 새 테스트**: 기능 구현 시 반드시 테스트 동반
- **버그 수정 = 회귀 테스트**: 버그를 재현하는 테스트를 먼저 작성하고, 수정 후 pass 확인
- **엣지 케이스 우선**: "행복한 경로(happy path)"만이 아닌 경계값, 예외 상황 커버
- **테스트 실패 = 빌드 실패**: CI에서 테스트 실패 시 머지 차단

---

## 2. 테스트 피라미드

```
        /  E2E  \         ~10% — 핵심 유저 플로우 (완료 버튼 1탭 루프)
       /----------\
      / Integration\      ~20% — 훅 + Firebase 모킹, 컴포넌트 상호작용
     /--------------\
    /    Unit Tests   \   ~70% — 유틸리티, 스토어, 순수 함수
   /--------------------\
```

| 레벨 | 대상 | 도구 | 비중 |
|------|------|------|------|
| Unit | `utils.ts`, `care-store.ts`, 순수 함수 | Vitest | 70% |
| Integration | React 훅, 컴포넌트 + 모킹된 Firebase | Vitest + Testing Library | 20% |
| E2E | 핵심 유저 플로우 | Playwright (향후) | 10% |

---

## 3. 테스트 우선순위

### P0 - 핵심 비즈니스 로직 (즉시)
| 모듈 | 함수/기능 | 리스크 | 상태 |
|------|-----------|--------|------|
| `src/lib/utils.ts` | `calculateNextDueDate` | **Critical** — 잘못된 주기 계산은 케어 누락으로 직결 | Done |
| `src/lib/utils.ts` | `getScheduleUrgency` | **High** — 잘못된 긴급도 표시는 UX 혼란 | Done |
| `src/lib/utils.ts` | `getDdayText` | **High** — 사용자에게 직접 노출 | Done |
| `src/lib/utils.ts` | `formatCurrency` | **Medium** — 지출 금액 표시 | Done |
| `src/stores/care-store.ts` | Zustand 스토어 전체 | **High** — 오프라인 큐 데이터 무결성 | Done |

### P1 - 데이터 레이어 (다음 단계)
| 모듈 | 함수/기능 | 리스크 | 상태 |
|------|-----------|--------|------|
| `src/hooks/use-care-items.ts` | `useCompleteCare` | **Critical** — 완료 처리 + 다음 일정 생성 | Done |
| `src/hooks/use-create-care-item.ts` | `useCreateCareItem` | **High** — 초기 스케줄 생성 | Done |
| `src/hooks/use-expenses.ts` | `useCreateExpense` | **Medium** — 지출 기록 | Done |
| `src/hooks/use-pets.ts` | `useCreatePet` | **Medium** — 반려동물 등록 | Done |

### P2 - UI 컴포넌트 (이후)
| 모듈 | 기능 | 리스크 | 상태 |
|------|------|--------|------|
| `CompleteModal` | 완료 모달 인터랙션 | **Medium** — 핵심 UX 플로우 | Done |
| 폼 페이지들 | 유효성 검증, 제출 | **Medium** | Planned |

### P3 - E2E (향후)
| 시나리오 | 설명 |
|----------|------|
| 케어 완료 루프 | 알림 확인 -> 완료 버튼 -> 다음 일정 자동 생성 |
| 반려동물 등록 | 폼 입력 -> 저장 -> 목록 반영 |
| 지출 기록 | 금액 입력 -> 카테고리 선택 -> 저장 -> 통계 반영 |

---

## 4. 엣지 케이스 목록

### calculateNextDueDate (주기 계산 엔진)

#### 월말 경계
- 1월 31일 + 1개월 = 2월 28일 (비윤년) / 2월 29일 (윤년)
- 1월 30일 + 1개월 = 2월 28일 (비윤년)
- 3월 31일 + 1개월 = 4월 30일
- 8월 31일 + 1개월 = 9월 30일

#### 윤년
- 2월 29일 + 1개월 = 3월 29일
- 2월 29일 + 12개월 = 다음해 2월 28일
- 윤년 2월 29일 + 365일 = 비윤년 2월 28일

#### 연도 경계
- 12월 25일 + 14일 = 다음해 1월 8일
- 12월 31일 + 1일 = 다음해 1월 1일
- 12월 1일 + 2개월 = 다음해 2월 1일

#### 큰 주기 값
- 365일 (연간 예방접종)
- 180일 (심장사상충 예방)
- 52주 (연간 정기검진)
- 24개월 (2년 주기 검진)

### getScheduleUrgency (긴급도 판정)
- 오늘 자정 기준 정확한 경계 판정
- 과거 날짜 -> overdue
- 오늘 -> due
- 미래 -> pending

### formatCurrency (금액 포맷)
- 0원
- 천 단위 구분자 (1,000 / 15,000 / 1,234,567)

---

## 5. 훅 테스트 전략 (Firebase 모킹)

### 접근 방식
Firebase SDK 함수들을 모킹하여 네트워크 의존성 제거:

```typescript
// 모킹 예시
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
}));
```

### 훅별 테스트 가치 평가

| 훅 | 테스트 가치 | 이유 |
|----|------------|------|
| `useCompleteCare` | **높음** | 완료 처리 + 다음 일정 생성 로직이 복합적 |
| `useCreateCareItem` | **높음** | 아이템 + 초기 스케줄 동시 생성 |
| `useCareItems` | **중간** | 복잡한 데이터 조합 로직 |
| `useCreateExpense` | **중간** | 단순 CRUD이지만 캐시 무효화 확인 필요 |
| `usePets` | **낮음** | 단순 CRUD |
| `useExpenseCategories` | **낮음** | 읽기 전용, 단순 |

### 권장: 비즈니스 로직 분리
테스트 용이성을 높이기 위해, 훅 내부의 비즈니스 로직을 순수 함수로 추출하는 것을 권장한다.

```typescript
// before: 로직이 훅 안에 묶여 있음
export function useCompleteCare() {
  return useMutation({
    mutationFn: async ({ ... }) => {
      // Firebase 호출 + 비즈니스 로직 혼재
    },
  });
}

// after: 순수 함수 분리 -> 단위 테스트 가능
export function buildCompleteCareBatch(params) { ... }  // 테스트 가능
export function useCompleteCare() {
  return useMutation({ mutationFn: buildCompleteCareBatch });
}
```

---

## 6. 테스트 파일 구조

```
src/
  lib/
    __tests__/
      utils.test.ts          # P0 - 유틸리티 함수 (Done)
  stores/
    __tests__/
      care-store.test.ts     # P0 - Zustand 스토어 (Done)
  hooks/
    __tests__/
      use-care-items.test.ts       # P1 - 케어 항목 훅 (Done)
      use-create-care-item.test.ts # P1 - 생성 훅 (Done)
      use-expenses.test.ts         # P1 - 지출 훅 (Done)
      use-pets.test.ts             # P1 - 반려동물 훅 (Done)
  components/
    care/
      __tests__/
        complete-modal.test.tsx    # P2 - 완료 모달 (Done)
```

---

## 7. 지속적 관리 프로세스

### 개발 워크플로우
1. **기능 개발**: TDD 사이클 (RED -> GREEN -> REFACTOR)
2. **코드 리뷰**: 테스트 코드도 리뷰 대상 (엣지 케이스 충분한지?)
3. **CI/CD**: 모든 PR에서 `npm test` 실행, 실패 시 머지 차단

### 버그 수정 워크플로우
1. 버그 재현하는 실패 테스트 작성
2. 코드 수정
3. 테스트 통과 확인
4. 회귀 방지를 위해 테스트 영구 유지

### 커버리지 목표
| 단계 | 목표 | 기한 |
|------|------|------|
| MVP Phase 1 | 핵심 비즈니스 로직 100% | 현재 (Done) |
| MVP Phase 2 | 전체 60%+ | 훅 테스트 추가 후 |
| Post-MVP | 전체 80%+ | 컴포넌트 + E2E 추가 후 |

### 테스트 건강 모니터링
- 플레이키(flaky) 테스트 발견 시 즉시 수정 (재시도가 아닌 근본 원인 해결)
- 커버리지 하락 시 PR에서 경고
- 매 스프린트 테스트 리뷰 (불필요한 테스트 정리, 누락된 케이스 추가)

---

## 8. 도구 및 설정

### 설치된 패키지
- `vitest` — 테스트 러너
- `@testing-library/react` — React 컴포넌트 테스트
- `@testing-library/jest-dom` — DOM 매처 확장
- `@testing-library/user-event` — 사용자 이벤트 시뮬레이션
- `jsdom` — 브라우저 환경 시뮬레이션

### 명령어
```bash
npm test              # 전체 테스트 실행
npm run test:watch    # 변경 감지 모드
npm run test:coverage # 커버리지 리포트
```

### 설정 파일
- `vitest.config.ts` — Vitest 설정 (environment, alias, coverage)
- `src/__tests__/setup.ts` — 전역 설정 (jest-dom matchers)
