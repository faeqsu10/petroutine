# Petroutine — 데이터베이스 ERD 문서

> 작성일: 2026-03-13
> 출처: `.omc/autopilot/spec.md` § 3.1 ~ 3.3
> 상태: v1.0 — MVP 기준
>
> **[DEPRECATED]** 이 문서는 Supabase(PostgreSQL) 기반 초기 설계입니다.
> 현재 프로젝트는 Firebase(Firestore)로 마이그레이션되었습니다.
> 실제 데이터 구조는 `src/types/database.ts`와 `firestore.rules`를 참조하세요.

---

## 목차

1. [ERD 다이어그램](#1-erd-다이어그램)
2. [테이블 정의 (DDL)](#2-테이블-정의-ddl)
   - 2.1 [users — 보호자](#21-users--보호자)
   - 2.2 [pets — 반려동물](#22-pets--반려동물)
   - 2.3 [care_items — 케어 항목 정의](#23-care_items--케어-항목-정의)
   - 2.4 [care_logs — 완료 기록](#24-care_logs--완료-기록)
   - 2.5 [care_schedules — 다음 예정일](#25-care_schedules--다음-예정일)
   - 2.6 [expenses — 지출 기록](#26-expenses--지출-기록)
   - 2.7 [expense_categories — 지출 카테고리](#27-expense_categories--지출-카테고리)
   - 2.8 [notification_settings — 알림 설정](#28-notification_settings--알림-설정)
3. [테이블 관계 설명](#3-테이블-관계-설명)
4. [Database Functions (트리거 및 자동화)](#4-database-functions-트리거-및-자동화)
5. [Seed Data — 기본 카테고리](#5-seed-data--기본-카테고리)
6. [마이그레이션 순서](#6-마이그레이션-순서)

---

## 1. ERD 다이어그램

```
┌──────────────────┐       ┌──────────────────────┐
│      users       │       │    notification_      │
│──────────────────│       │    settings            │
│ id (PK, uuid)    │──┐    │──────────────────────│
│ email            │  │    │ id (PK, uuid)        │
│ display_name     │  │    │ user_id (FK → users) │
│ avatar_url       │  │    │ enabled              │
│ timezone         │  │    │ quiet_start          │
│ created_at       │  │    │ quiet_end            │
│ updated_at       │  │    │ advance_hours        │
└──────────────────┘  │    │ preferred_time       │
         │            │    │ fcm_token            │
         │ 1:N        │    │ created_at           │
         ▼            │    │ updated_at           │
┌──────────────────┐  │    └──────────────────────┘
│       pets       │  │
│──────────────────│  │
│ id (PK, uuid)    │  │
│ user_id (FK)     │──┘
│ name             │
│ species          │
│ breed            │
│ birth_date       │
│ gender           │
│ neutered         │
│ weight_kg        │
│ avatar_url       │
│ created_at       │
│ updated_at       │
│ archived_at      │
└──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────────┐
│   care_items     │       │   care_schedules     │
│──────────────────│       │──────────────────────│
│ id (PK, uuid)    │──┐    │ id (PK, uuid)        │
│ pet_id (FK)      │  │    │ care_item_id (FK)    │
│ category         │  │    │ next_due_date        │
│ name             │  │    │ status               │
│ cycle_value      │  │    │ created_at           │
│ cycle_unit       │  │    │ updated_at           │
│ icon             │  │    └──────────────────────┘
│ color            │  │               ▲
│ is_active        │  │               │ 1:1 (active)
│ notify_enabled   │  │               │
│ created_at       │  ├───────────────┘
│ updated_at       │  │
└──────────────────┘  │
         │            │
         │ 1:N        │
         ▼            │
┌──────────────────┐  │
│   care_logs      │  │
│──────────────────│  │
│ id (PK, uuid)    │  │
│ care_item_id(FK) │──┘
│ completed_at     │
│ scheduled_date   │
│ memo             │
│ created_at       │
└──────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│   expense_categories │       │      expenses        │
│──────────────────────│       │──────────────────────│
│ id (PK, uuid)        │──┐    │ id (PK, uuid)        │
│ user_id (FK → users) │  │    │ pet_id (FK → pets)   │
│ name                 │  │    │ category_id (FK)     │──┐
│ icon                 │  │    │ amount               │  │
│ color                │  │    │ description          │  │
│ is_default           │  │    │ expense_date         │  │
│ sort_order           │  │    │ receipt_url          │  │
│ created_at           │  │    │ memo                 │  │
└──────────────────────┘  │    │ created_at           │  │
                          │    │ updated_at           │  │
                          │    └──────────────────────┘  │
                          │               ▲              │
                          └───────────────┘              │
                                          └──────────────┘
```

---

## 2. 테이블 정의 (DDL)

### 2.1 `users` — 보호자

Supabase Auth의 `auth.users`와 연동되는 퍼블릭 프로필 테이블.
회원가입 시 `handle_new_user()` 트리거에 의해 자동 생성된다.

```sql
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT,
  timezone     TEXT NOT NULL DEFAULT 'Asia/Seoul',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_users_email ON public.users(email);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, FK → auth.users | Supabase Auth ID와 동일 |
| email | TEXT | NOT NULL | 이메일 |
| display_name | TEXT | NOT NULL, DEFAULT '' | 표시 이름 |
| avatar_url | TEXT | NULLABLE | 프로필 이미지 URL |
| timezone | TEXT | NOT NULL, DEFAULT 'Asia/Seoul' | 사용자 시간대 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 가입일 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정일 |

---

### 2.2 `pets` — 반려동물

보호자 1명이 여러 반려동물을 등록할 수 있다. `archived_at`을 이용한 soft delete 방식을 사용한다.

```sql
CREATE TABLE public.pets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  species     TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  breed       TEXT,
  birth_date  DATE,
  gender      TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  neutered    BOOLEAN DEFAULT false,
  weight_kg   DECIMAL(5,2),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ  -- soft delete
);

-- 인덱스
CREATE INDEX idx_pets_user_id ON public.pets(user_id);
CREATE INDEX idx_pets_user_active ON public.pets(user_id) WHERE archived_at IS NULL;

-- RLS
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pets_all_own" ON public.pets
  FOR ALL USING (auth.uid() = user_id);
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 반려동물 고유 ID |
| user_id | UUID | FK → users, NOT NULL | 보호자 |
| name | TEXT | NOT NULL | 이름 (예: "초코") |
| species | TEXT | NOT NULL, CHECK | 종류: 'dog', 'cat', 'other' |
| breed | TEXT | NULLABLE | 품종 (예: "말티즈") |
| birth_date | DATE | NULLABLE | 생년월일 |
| gender | TEXT | CHECK | 성별: 'male', 'female', 'unknown' |
| neutered | BOOLEAN | DEFAULT false | 중성화 여부 |
| weight_kg | DECIMAL(5,2) | NULLABLE | 체중 (kg) |
| avatar_url | TEXT | NULLABLE | 프로필 사진 URL |
| created_at | TIMESTAMPTZ | NOT NULL | 등록일 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일 |
| archived_at | TIMESTAMPTZ | NULLABLE | 삭제일 (soft delete) |

---

### 2.3 `care_items` — 케어 항목 정의

반려동물에 귀속되는 케어 루틴의 정의 테이블. 주기(cycle_value + cycle_unit)를 기반으로 다음 예정일이 자동 계산된다.

```sql
CREATE TYPE care_category AS ENUM ('hygiene', 'health', 'daily', 'custom');
CREATE TYPE cycle_unit AS ENUM ('day', 'week', 'month');

CREATE TABLE public.care_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id         UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  category       care_category NOT NULL DEFAULT 'custom',
  name           TEXT NOT NULL,
  cycle_value    INTEGER NOT NULL CHECK (cycle_value > 0),
  cycle_unit     cycle_unit NOT NULL DEFAULT 'day',
  icon           TEXT DEFAULT '📋',
  color          TEXT DEFAULT '#6366F1',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  notify_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_care_items_pet_id ON public.care_items(pet_id);
CREATE INDEX idx_care_items_pet_active ON public.care_items(pet_id) WHERE is_active = true;

-- RLS (pet 소유자만 접근)
ALTER TABLE public.care_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_items_own" ON public.care_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pets WHERE pets.id = care_items.pet_id AND pets.user_id = auth.uid()
    )
  );
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 케어 항목 ID |
| pet_id | UUID | FK → pets, NOT NULL | 소속 반려동물 |
| category | ENUM | NOT NULL | 카테고리: hygiene, health, daily, custom |
| name | TEXT | NOT NULL | 항목명 (예: "발톱 깎기") |
| cycle_value | INTEGER | NOT NULL, > 0 | 주기 숫자 (예: 14) |
| cycle_unit | ENUM | NOT NULL | 주기 단위: day, week, month |
| icon | TEXT | DEFAULT | 아이콘 (이모지 또는 아이콘명) |
| color | TEXT | DEFAULT | 색상 코드 |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 활성/비활성 |
| notify_enabled | BOOLEAN | NOT NULL, DEFAULT true | 이 항목 알림 여부 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일 |

**카테고리별 기본 템플릿:**

| 카테고리 | 항목 | 기본 주기 |
|----------|------|-----------|
| hygiene (위생) | 목욕, 발톱 깎기, 귀 청소, 양치, 빗질 | 14일, 14일, 7일, 1일, 3일 |
| health (건강) | 예방접종, 혈액검사, 구충, 심장사상충, 체중 측정 | 365일, 180일, 30일, 30일, 30일 |
| daily (생활) | 물 갈기, 사료 주문, 모래 갈기, 장난감 세척, 하우스 청소 | 1일, 30일, 3일, 7일, 7일 |

---

### 2.4 `care_logs` — 완료 기록

"완료" 버튼을 누를 때마다 생성되는 이력 테이블.
`scheduled_date`는 미루기/빠른 완료 추적을 위해 원래 예정일을 보존한다.

```sql
CREATE TABLE public.care_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_item_id    UUID NOT NULL REFERENCES public.care_items(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_date  DATE,          -- 원래 예정일 (미루기/빠른 완료 추적용)
  memo            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_care_logs_item_id ON public.care_logs(care_item_id);
CREATE INDEX idx_care_logs_completed ON public.care_logs(care_item_id, completed_at DESC);
CREATE INDEX idx_care_logs_date ON public.care_logs(completed_at);

-- RLS
ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_logs_own" ON public.care_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.care_items ci
      JOIN public.pets p ON p.id = ci.pet_id
      WHERE ci.id = care_logs.care_item_id AND p.user_id = auth.uid()
    )
  );
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 기록 ID |
| care_item_id | UUID | FK → care_items, NOT NULL | 완료한 케어 항목 |
| completed_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 실제 완료 시각 |
| scheduled_date | DATE | NULLABLE | 원래 예정이었던 날짜 |
| memo | TEXT | NULLABLE | 메모 (선택) |
| created_at | TIMESTAMPTZ | NOT NULL | 레코드 생성 시각 |

---

### 2.5 `care_schedules` — 다음 예정일

각 `care_item`당 활성 상태(pending/due/overdue)인 스케줄은 1개만 존재하는 구조 (Partial Unique Index로 강제).
완료 또는 건너뛰기 처리 시 새로운 pending 스케줄이 생성된다.

```sql
CREATE TYPE schedule_status AS ENUM ('pending', 'due', 'overdue', 'completed', 'skipped');

CREATE TABLE public.care_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_item_id    UUID NOT NULL REFERENCES public.care_items(id) ON DELETE CASCADE,
  next_due_date   DATE NOT NULL,
  status          schedule_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE UNIQUE INDEX idx_care_schedules_active ON public.care_schedules(care_item_id)
  WHERE status IN ('pending', 'due', 'overdue');
CREATE INDEX idx_care_schedules_due_date ON public.care_schedules(next_due_date)
  WHERE status IN ('pending', 'due', 'overdue');
CREATE INDEX idx_care_schedules_status ON public.care_schedules(status);

-- RLS
ALTER TABLE public.care_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_schedules_own" ON public.care_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.care_items ci
      JOIN public.pets p ON p.id = ci.pet_id
      WHERE ci.id = care_schedules.care_item_id AND p.user_id = auth.uid()
    )
  );
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 스케줄 ID |
| care_item_id | UUID | FK → care_items, NOT NULL, UNIQUE(활성) | 대상 케어 항목 |
| next_due_date | DATE | NOT NULL | 다음 예정일 |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 상태: pending, due, overdue, completed, skipped |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일 |

**상태 전이:**

```
pending → due (당일 도달) → overdue (초과) → completed (완료 체크)
pending → skipped (건너뛰기)
completed/skipped → (새 스케줄 pending 생성)
```

---

### 2.6 `expenses` — 지출 기록

반려동물별 지출 내역. `amount`는 원 단위 정수로 저장하여 부동소수점 오차를 방지한다.

```sql
CREATE TABLE public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.expense_categories(id),
  amount          INTEGER NOT NULL CHECK (amount > 0),  -- 원 단위 (정수)
  description     TEXT NOT NULL DEFAULT '',
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  memo            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_expenses_pet_id ON public.expenses(pet_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_pet_date ON public.expenses(pet_id, expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category_id);

-- RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_own" ON public.expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pets WHERE pets.id = expenses.pet_id AND pets.user_id = auth.uid()
    )
  );
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 지출 ID |
| pet_id | UUID | FK → pets, NOT NULL | 대상 반려동물 |
| category_id | UUID | FK → expense_categories, NOT NULL | 지출 카테고리 |
| amount | INTEGER | NOT NULL, > 0 | 금액 (원 단위, 정수) |
| description | TEXT | NOT NULL, DEFAULT '' | 내역 설명 (예: "로얄캐닌 사료 3kg") |
| expense_date | DATE | NOT NULL | 지출 날짜 |
| receipt_url | TEXT | NULLABLE | 영수증 이미지 URL |
| memo | TEXT | NULLABLE | 메모 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일 |

---

### 2.7 `expense_categories` — 지출 카테고리

시스템 기본 카테고리(`is_default = true`, `user_id = NULL`)와 사용자 정의 카테고리를 함께 관리한다.
신규 사용자 가입 시 `handle_new_user()` 트리거가 기본 카테고리를 자동으로 복사해준다.

```sql
CREATE TABLE public.expense_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '💰',
  color       TEXT DEFAULT '#10B981',
  is_default  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_expense_categories_user ON public.expense_categories(user_id);

-- RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_categories_own_or_default" ON public.expense_categories
  FOR SELECT USING (user_id = auth.uid() OR is_default = true);
CREATE POLICY "expense_categories_manage_own" ON public.expense_categories
  FOR ALL USING (user_id = auth.uid());
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 카테고리 ID |
| user_id | UUID | FK → users, NULLABLE | 소유자 (NULL이면 시스템 기본) |
| name | TEXT | NOT NULL | 카테고리명 |
| icon | TEXT | DEFAULT | 아이콘 |
| color | TEXT | DEFAULT | 색상 코드 |
| is_default | BOOLEAN | NOT NULL | 시스템 기본 카테고리 여부 |
| sort_order | INTEGER | NOT NULL | 정렬 순서 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일 |

---

### 2.8 `notification_settings` — 알림 설정

사용자당 1개의 레코드만 존재 (UNIQUE 제약). 가입 시 자동 생성된다.

```sql
CREATE TABLE public.notification_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  quiet_start     TIME,           -- 방해 금지 시작 (예: 22:00)
  quiet_end       TIME,           -- 방해 금지 종료 (예: 08:00)
  advance_hours   INTEGER NOT NULL DEFAULT 0,  -- 예정일 N시간 전 알림
  preferred_time  TIME NOT NULL DEFAULT '09:00',  -- 알림 선호 시각
  fcm_token       TEXT,           -- FCM 디바이스 토큰
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE UNIQUE INDEX idx_notification_settings_user ON public.notification_settings(user_id);

-- RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_settings_own" ON public.notification_settings
  FOR ALL USING (auth.uid() = user_id);
```

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 설정 ID |
| user_id | UUID | FK → users, NOT NULL, UNIQUE | 사용자 (1인당 1개) |
| enabled | BOOLEAN | NOT NULL, DEFAULT true | 전체 알림 on/off |
| quiet_start | TIME | NULLABLE | 방해 금지 시작 시각 |
| quiet_end | TIME | NULLABLE | 방해 금지 종료 시각 |
| advance_hours | INTEGER | NOT NULL, DEFAULT 0 | 예정일 N시간 전 사전 알림 (0=당일) |
| preferred_time | TIME | NOT NULL, DEFAULT '09:00' | 알림 발송 선호 시각 |
| fcm_token | TEXT | NULLABLE | FCM 푸시 토큰 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일 |

---

## 3. 테이블 관계 설명

```
auth.users (Supabase 내부)
    │
    │ 1:1 (트리거로 자동 생성)
    ▼
users ──────────────────────────────────────┐
    │                                        │
    │ 1:1                                    │ 1:N
    ▼                                        ▼
notification_settings            expense_categories
                                 (user_id NULL = 시스템 기본)
    │
    │ 1:N (users → pets)
    ▼
pets
    │
    ├─── 1:N ──► care_items
    │                │
    │                ├─── 1:1 (활성 기준) ──► care_schedules
    │                │
    │                └─── 1:N ──────────────► care_logs
    │
    └─── 1:N ──► expenses ──► expense_categories
```

| 관계 | 설명 |
|------|------|
| `auth.users` → `users` | 1:1. 회원가입 트리거로 자동 생성. `id` 공유. |
| `users` → `pets` | 1:N. 보호자 한 명이 여러 반려동물 소유. |
| `users` → `notification_settings` | 1:1. 사용자당 알림 설정 1개. |
| `users` → `expense_categories` | 1:N. 사용자 정의 카테고리. `user_id = NULL`이면 시스템 기본. |
| `pets` → `care_items` | 1:N. 반려동물당 여러 케어 항목 정의. |
| `care_items` → `care_schedules` | 1:1 (활성 기준). 한 항목에 활성 스케줄은 최대 1개 (Partial Unique Index). |
| `care_items` → `care_logs` | 1:N. 완료 이력은 누적 기록됨. |
| `pets` → `expenses` | 1:N. 반려동물별 지출 내역. |
| `expense_categories` → `expenses` | 1:N. 지출 카테고리와 지출 내역. |

**RLS 정책 요약:**

모든 테이블에 Row Level Security가 적용된다. 접근 권한은 `auth.uid()`를 기준으로 결정된다.
중첩된 테이블(`care_items`, `care_logs`, `care_schedules`, `expenses`)은 JOIN을 통해 `pets.user_id = auth.uid()`를 검증한다.

---

## 4. Database Functions (트리거 및 자동화)

### 4.1 자동 `updated_at` 트리거

`updated_at` 필드가 있는 모든 테이블에 동일한 트리거 함수를 적용한다.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.care_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.care_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.2 사용자 프로필 자동 생성 (Auth 연동)

`auth.users`에 신규 사용자가 INSERT되면 아래 트리거가 자동으로 실행된다.

수행 작업:
1. `public.users` 프로필 레코드 생성
2. `notification_settings` 기본값으로 생성
3. 시스템 기본 `expense_categories`를 사용자 복사본으로 INSERT

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. 프로필 생성
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', '')
  );

  -- 2. 알림 설정 생성
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);

  -- 3. 기본 지출 카테고리 복사
  INSERT INTO public.expense_categories (user_id, name, icon, color, is_default, sort_order)
  SELECT NEW.id, name, icon, color, false, sort_order
  FROM public.expense_categories
  WHERE is_default = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

> `SECURITY DEFINER`를 사용하여 트리거 함수가 `auth.users` 테이블에 접근할 수 있도록 한다.

---

## 5. Seed Data — 기본 카테고리

신규 사용자에게 자동으로 복사될 시스템 기본 지출 카테고리.
`user_id = NULL`, `is_default = true`로 삽입한다.

```sql
INSERT INTO public.expense_categories (user_id, name, icon, color, is_default, sort_order) VALUES
  (NULL, '사료/간식',   '🍖', '#F59E0B', true, 1),
  (NULL, '병원/의료',   '🏥', '#EF4444', true, 2),
  (NULL, '미용/위생',   '✂️', '#8B5CF6', true, 3),
  (NULL, '용품/장난감', '🧸', '#3B82F6', true, 4),
  (NULL, '보험',        '🛡️', '#6366F1', true, 5),
  (NULL, '기타',        '📦', '#6B7280', true, 6);
```

| name | icon | color | sort_order |
|------|------|-------|------------|
| 사료/간식 | 🍖 | #F59E0B | 1 |
| 병원/의료 | 🏥 | #EF4444 | 2 |
| 미용/위생 | ✂️ | #8B5CF6 | 3 |
| 용품/장난감 | 🧸 | #3B82F6 | 4 |
| 보험 | 🛡️ | #6366F1 | 5 |
| 기타 | 📦 | #6B7280 | 6 |

---

## 6. 마이그레이션 순서

외래 키(FK) 의존성에 따라 아래 순서로 마이그레이션해야 한다.

```
1. ENUM 타입 생성
   └─ care_category, cycle_unit, schedule_status

2. expense_categories (user_id FK 이전에 테이블 자체 먼저 생성)
   └─ users를 참조하지만, users보다 먼저 생성 후 ALTER로 FK 추가하거나
      users 생성 후 expense_categories 생성 순서 조정 필요

올바른 순서:

Step 1. ENUM 타입 생성
Step 2. users (auth.users 참조)
Step 3. expense_categories (users 참조)
Step 4. notification_settings (users 참조)
Step 5. pets (users 참조)
Step 6. care_items (pets 참조)
Step 7. care_logs (care_items 참조)
Step 8. care_schedules (care_items 참조)
Step 9. expenses (pets + expense_categories 참조)

Step 10. update_updated_at 함수 및 트리거 (모든 테이블 완성 후)
Step 11. handle_new_user 함수 및 트리거 (auth.users 트리거)
Step 12. Seed Data INSERT (expense_categories 기본 카테고리)
```

**의존성 그래프 요약:**

```
auth.users (Supabase 내장)
    │
    ▼
users
    ├──► expense_categories
    ├──► notification_settings
    └──► pets
              ├──► care_items
              │        ├──► care_logs
              │        └──► care_schedules
              └──► expenses ──► expense_categories
```

---

*이 문서는 `spec.md` § 3.1 ~ 3.3을 기반으로 작성되었습니다. 스키마 변경 시 두 문서를 함께 업데이트하세요.*
