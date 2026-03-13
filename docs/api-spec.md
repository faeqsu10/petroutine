# Petroutine - API 명세서 (API Specification)

> **문서 버전:** v1.0
> **작성일:** 2026-03-13
> **기준:** Technical Specification v1.0 (MVP)
> **상태:** Draft
>
> **[DEPRECATED]** 이 문서는 Supabase REST API + Edge Functions 기반 초기 설계입니다.
> 현재 프로젝트는 Firebase(Firestore + Firebase Auth)로 마이그레이션되었습니다.
> 실제 API는 클라이언트에서 Firestore SDK를 직접 호출합니다 (`src/hooks/` 참조).

---

## 목차

1. [공통 규약](#1-공통-규약)
2. [Auth -- 인증](#2-auth----인증)
3. [Users -- 사용자 프로필](#3-users----사용자-프로필)
4. [Pets -- 반려동물 CRUD](#4-pets----반려동물-crud)
5. [Care Items -- 케어 항목 CRUD](#5-care-items----케어-항목-crud)
6. [Care Completion -- 완료/건너뛰기/미루기](#6-care-completion----완료건너뛰기미루기)
7. [Care Logs -- 완료 기록 조회](#7-care-logs----완료-기록-조회)
8. [Dashboard -- 홈 대시보드](#8-dashboard----홈-대시보드)
9. [Expenses -- 지출 CRUD](#9-expenses----지출-crud)
10. [Statistics -- 통계](#10-statistics----통계)
11. [Notification Settings -- 알림 설정](#11-notification-settings----알림-설정)
12. [Care Templates -- 케어 항목 템플릿](#12-care-templates----케어-항목-템플릿)
13. [비즈니스 로직](#13-비즈니스-로직)

---

## 1. 공통 규약

### 1.1 Base URL

| 용도 | Base URL |
|------|----------|
| Supabase REST API (CRUD) | `https://<project-ref>.supabase.co/rest/v1/` |
| Supabase Auth | `https://<project-ref>.supabase.co/auth/v1/` |
| Edge Functions (비즈니스 로직) | `https://<project-ref>.supabase.co/functions/v1/` |

### 1.2 인증 헤더

모든 API 요청에 아래 헤더가 필요하다 (Auth 엔드포인트 제외).

```
Authorization: Bearer <access_token>
apikey: <supabase_anon_key>
Content-Type: application/json
```

- `access_token`: Supabase Auth에서 발급받은 JWT
- `apikey`: Supabase 프로젝트의 anon public key
- RLS(Row Level Security)가 `auth.uid()`로 사용자별 데이터를 자동 격리

### 1.3 에러 응답 형식

모든 에러는 아래 형식으로 응답한다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "cycle_value must be greater than 0"
  }
}
```

**주요 에러 코드:**

| HTTP Status | code | 설명 |
|-------------|------|------|
| 400 | `VALIDATION_ERROR` | 요청 데이터 유효성 검사 실패 |
| 401 | `UNAUTHORIZED` | 인증 토큰 없음 또는 만료 |
| 403 | `FORBIDDEN` | 해당 리소스에 대한 권한 없음 (RLS 위반) |
| 404 | `NOT_FOUND` | 리소스를 찾을 수 없음 |
| 409 | `CONFLICT` | 중복 데이터 등 충돌 |
| 429 | `RATE_LIMITED` | 요청 횟수 초과 |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |

### 1.4 페이지네이션

REST API 목록 조회 시 query parameter로 제어한다.

```
?offset=0&limit=20
```

| 파라미터 | 기본값 | 최대값 | 설명 |
|----------|--------|--------|------|
| `offset` | 0 | - | 건너뛸 레코드 수 |
| `limit` | 20 | 100 | 반환할 최대 레코드 수 |

응답 헤더에 전체 카운트가 포함된다:

```
Content-Range: 0-19/45
```

### 1.5 날짜 형식

- **날짜만**: ISO 8601 date (`2026-03-13`)
- **날짜+시간**: ISO 8601 datetime with timezone (`2026-03-13T09:00:00+09:00`)
- **시간대**: 기본 `Asia/Seoul` (KST, UTC+9)

### 1.6 정렬

Supabase REST API 정렬 문법:

```
?order=created_at.desc          // 단일 정렬
?order=category.asc,name.asc    // 복합 정렬
```

### 1.7 필터링

Supabase REST API PostgREST 필터 문법:

```
?column=eq.value          // 같음
?column=neq.value         // 같지 않음
?column=gt.value          // 초과
?column=gte.value         // 이상
?column=lt.value          // 미만
?column=lte.value         // 이하
?column=is.null           // NULL
?column=in.(a,b,c)        // IN 절
```

---

## 2. Auth -- 인증

Supabase Auth SDK를 통해 클라이언트에서 직접 호출한다. 별도 API 서버 불필요.

### 2.1 회원가입

```
POST /auth/v1/signup
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "data": {
    "display_name": "홍길동"
  }
}
```

**Response `200 OK`:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "v1.MjQ1Njc4OTAx...",
    "expires_in": 3600
  }
}
```

**부수 효과:**
- `auth.users`에 레코드 생성
- DB 트리거 `handle_new_user()`가 자동 실행:
  - `public.users` 프로필 레코드 생성
  - `notification_settings` 기본값으로 생성
  - 기본 `expense_categories` 복사

### 2.2 로그인 (이메일/비밀번호)

```
POST /auth/v1/token?grant_type=password
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response `200 OK`:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "v1.MjQ1Njc4OTAx...",
    "expires_in": 3600
  }
}
```

### 2.3 로그아웃

```
POST /auth/v1/logout
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response `204 No Content`**

### 2.4 토큰 갱신

```
POST /auth/v1/token?grant_type=refresh_token
```

**Request Body:**

```json
{
  "refresh_token": "v1.MjQ1Njc4OTAx..."
}
```

**Response `200 OK`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "v1.NEW_REFRESH_TOKEN...",
  "expires_in": 3600
}
```

> Refresh token rotation이 적용되어, 갱신 시 이전 refresh token은 즉시 무효화된다.

### 2.5 소셜 로그인 (OAuth)

브라우저에서 리다이렉트 방식으로 처리한다.

```
GET /auth/v1/authorize?provider=kakao
GET /auth/v1/authorize?provider=google
GET /auth/v1/authorize?provider=apple
```

**소셜 로그인 우선순위 (한국 시장):**

| 순위 | Provider | 설명 |
|------|----------|------|
| 1 | Kakao | 필수 -- 한국 사용자 대부분 사용 |
| 2 | Google | 권장 |
| 3 | Apple | iOS PWA 사용자 대응 |
| 4 | Email/Password | 기본 fallback |

**OAuth 콜백:**

```
GET /auth/callback
```

인증 완료 후 Supabase가 앱의 callback URL로 리다이렉트하며, session 정보를 전달한다.

---

## 3. Users -- 사용자 프로필

RLS로 자신의 프로필만 조회/수정 가능.

### 3.1 내 프로필 조회

```
GET /rest/v1/users?id=eq.{user_id}
```

**Response `200 OK`:**

```json
[{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "display_name": "홍길동",
  "avatar_url": null,
  "timezone": "Asia/Seoul",
  "created_at": "2026-03-13T00:00:00+09:00",
  "updated_at": "2026-03-13T00:00:00+09:00"
}]
```

### 3.2 프로필 수정

```
PATCH /rest/v1/users?id=eq.{user_id}
```

**Request Body:**

```json
{
  "display_name": "새이름",
  "avatar_url": "https://storage.example.com/avatars/user.jpg"
}
```

**Response `200 OK`:** 수정된 레코드

**수정 가능 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `display_name` | string | 표시 이름 |
| `avatar_url` | string (nullable) | 프로필 이미지 URL |
| `timezone` | string | 시간대 (기본: `Asia/Seoul`) |

---

## 4. Pets -- 반려동물 CRUD

RLS로 자신의 반려동물만 접근 가능. 삭제는 soft delete (`archived_at` 필드).

### 4.1 반려동물 목록 조회

```
GET /rest/v1/pets?archived_at=is.null&order=created_at.asc
```

**Response `200 OK`:**

```json
[{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "초코",
  "species": "dog",
  "breed": "말티즈",
  "birth_date": "2023-05-15",
  "gender": "male",
  "neutered": true,
  "weight_kg": 3.5,
  "avatar_url": "https://storage.example.com/pets/choco.jpg",
  "created_at": "2026-01-01T00:00:00+09:00",
  "updated_at": "2026-01-01T00:00:00+09:00"
}]
```

### 4.2 반려동물 등록

```
POST /rest/v1/pets
```

**Request Body:**

```json
{
  "name": "초코",
  "species": "dog",
  "breed": "말티즈",
  "birth_date": "2023-05-15",
  "gender": "male",
  "neutered": true,
  "weight_kg": 3.5
}
```

**필드 유효성:**

| 필드 | 필수 | 타입 | 제약 |
|------|------|------|------|
| `name` | O | string | - |
| `species` | O | string | `'dog'`, `'cat'`, `'other'` 중 하나 |
| `breed` | X | string | - |
| `birth_date` | X | date | ISO 8601 date |
| `gender` | X | string | `'male'`, `'female'`, `'unknown'` 중 하나 |
| `neutered` | X | boolean | 기본값 `false` |
| `weight_kg` | X | decimal | DECIMAL(5,2), 양수 |
| `avatar_url` | X | string | 유효한 URL |

**Response `201 Created`:** 생성된 레코드

### 4.3 반려동물 정보 수정

```
PATCH /rest/v1/pets?id=eq.{pet_id}
```

**Request Body:**

```json
{
  "weight_kg": 3.8,
  "neutered": true
}
```

**Response `200 OK`:** 수정된 레코드

### 4.4 반려동물 삭제 (Soft Delete)

물리 삭제가 아닌 `archived_at` 타임스탬프를 설정하여 soft delete 처리한다.

```
PATCH /rest/v1/pets?id=eq.{pet_id}
```

**Request Body:**

```json
{
  "archived_at": "2026-03-13T00:00:00+09:00"
}
```

**Response `200 OK`:** 수정된 레코드

> `archived_at`이 설정된 반려동물은 목록 조회 시 `?archived_at=is.null` 필터에 의해 제외된다.
> 관련 케어 항목과 지출 기록은 보존된다.

---

## 5. Care Items -- 케어 항목 CRUD

반려동물에 연결된 케어 항목을 관리한다. RLS는 `pets.user_id`를 통해 소유권을 확인한다.

### 5.1 케어 항목 목록 조회

```
GET /rest/v1/care_items?pet_id=eq.{pet_id}&is_active=eq.true&order=category.asc,name.asc
```

관련 스케줄을 함께 조회할 수 있다:

```
GET /rest/v1/care_items?pet_id=eq.{pet_id}&is_active=eq.true&select=*,care_schedules(id,next_due_date,status)&order=category.asc,name.asc
```

**Response `200 OK`:**

```json
[{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "category": "hygiene",
  "name": "목욕",
  "cycle_value": 14,
  "cycle_unit": "day",
  "icon": "🛁",
  "color": "#8B5CF6",
  "is_active": true,
  "notify_enabled": true,
  "created_at": "2026-01-01T00:00:00+09:00",
  "updated_at": "2026-01-01T00:00:00+09:00",
  "care_schedules": [{
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "next_due_date": "2026-03-20",
    "status": "pending"
  }]
}]
```

### 5.2 케어 항목 추가

```
POST /rest/v1/care_items
```

**Request Body:**

```json
{
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "category": "hygiene",
  "name": "목욕",
  "cycle_value": 14,
  "cycle_unit": "day",
  "icon": "🛁",
  "color": "#8B5CF6"
}
```

**필드 유효성:**

| 필드 | 필수 | 타입 | 제약 |
|------|------|------|------|
| `pet_id` | O | uuid | 유효한 반려동물 ID |
| `category` | O | enum | `'hygiene'`, `'health'`, `'daily'`, `'custom'` |
| `name` | O | string | - |
| `cycle_value` | O | integer | 1 이상의 양수 |
| `cycle_unit` | O | enum | `'day'`, `'week'`, `'month'` |
| `icon` | X | string | 기본값 `'📋'` |
| `color` | X | string | hex 색상 코드, 기본값 `'#6366F1'` |
| `notify_enabled` | X | boolean | 기본값 `true` |

**Response `201 Created`:** 생성된 레코드

**부수 효과:**
- `care_schedules`에 초기 스케줄 자동 생성 (DB 트리거 또는 Edge Function)
- 초기 `next_due_date` = 오늘 + cycle_interval

### 5.3 케어 항목 수정

```
PATCH /rest/v1/care_items?id=eq.{item_id}
```

**Request Body:**

```json
{
  "cycle_value": 21,
  "cycle_unit": "day",
  "notify_enabled": false
}
```

**Response `200 OK`:** 수정된 레코드

**부수 효과:**
- 주기 변경 시 활성 스케줄의 `next_due_date`가 재계산된다 (마지막 완료일 + 새 주기)

### 5.4 케어 항목 비활성화

삭제 대신 비활성화하여 이력을 보존한다.

```
PATCH /rest/v1/care_items?id=eq.{item_id}
```

**Request Body:**

```json
{
  "is_active": false
}
```

**Response `200 OK`:** 수정된 레코드

**부수 효과:**
- 활성 스케줄이 `'skipped'` 상태로 변경
- 해당 항목의 알림이 제거됨

---

## 6. Care Completion -- 완료/건너뛰기/미루기

서비스의 핵심 동작 API. Edge Function으로 구현하여 트랜잭션 내에서 원자적 처리를 보장한다.

### 6.1 케어 완료

```
POST /functions/v1/complete-care
```

**Request Body:**

```json
{
  "care_item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "completed_at": "2026-03-13T14:30:00+09:00",
  "memo": "발톱이 많이 자라있었음"
}
```

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `care_item_id` | O | uuid | 완료할 케어 항목 ID |
| `completed_at` | X | datetime | 완료 시각 (기본: `now()`) |
| `memo` | X | string | 메모 |

**Response `200 OK`:**

```json
{
  "care_log": {
    "id": "d4e5f6a7-b8c9-0123-def0-1234567890ab",
    "care_item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "completed_at": "2026-03-13T14:30:00+09:00",
    "scheduled_date": "2026-03-13",
    "memo": "발톱이 많이 자라있었음"
  },
  "next_schedule": {
    "id": "e5f6a7b8-c9d0-1234-ef01-234567890abc",
    "care_item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "next_due_date": "2026-03-27",
    "status": "pending"
  }
}
```

**처리 순서 (트랜잭션 내):**

1. `care_items`에서 항목 정보 조회 (활성 여부 확인)
2. `care_logs`에 완료 기록 INSERT
3. 현재 활성 `care_schedules`의 status를 `'completed'`로 UPDATE
4. 주기 계산 엔진으로 다음 예정일 계산
5. 새로운 `care_schedules` INSERT (status: `'pending'`)
6. 알림 스케줄 갱신 (비동기)

### 6.2 케어 건너뛰기

```
POST /functions/v1/skip-care
```

**Request Body:**

```json
{
  "care_item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "reason": "오늘 비와서 다음에"
}
```

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `care_item_id` | O | uuid | 건너뛸 케어 항목 ID |
| `reason` | X | string | 건너뛴 사유 |

**Response `200 OK`:**

```json
{
  "skipped_schedule": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "status": "skipped"
  },
  "next_schedule": {
    "id": "e5f6a7b8-c9d0-1234-ef01-234567890abc",
    "next_due_date": "2026-03-27",
    "status": "pending"
  }
}
```

### 6.3 케어 미루기

현재 예정일을 지정한 날짜로 변경한다.

```
POST /functions/v1/postpone-care
```

**Request Body:**

```json
{
  "care_item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "postpone_to": "2026-03-16"
}
```

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `care_item_id` | O | uuid | 미룰 케어 항목 ID |
| `postpone_to` | O | date | 미룰 날짜 (미래 날짜만 가능) |

**Response `200 OK`:**

```json
{
  "schedule": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "next_due_date": "2026-03-16",
    "status": "pending"
  }
}
```

---

## 7. Care Logs -- 완료 기록 조회

### 7.1 항목별 완료 이력

```
GET /rest/v1/care_logs?care_item_id=eq.{item_id}&order=completed_at.desc&limit=10
```

**Response `200 OK`:**

```json
[{
  "id": "d4e5f6a7-b8c9-0123-def0-1234567890ab",
  "care_item_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "completed_at": "2026-03-13T14:30:00+09:00",
  "scheduled_date": "2026-03-13",
  "memo": "발톱이 많이 자라있었음",
  "created_at": "2026-03-13T14:30:00+09:00"
}]
```

### 7.2 최근 완료 기록 (전체, JOIN 포함)

```
GET /rest/v1/care_logs?select=*,care_items(name,icon,pet_id)&order=completed_at.desc&limit=20
```

**Response `200 OK`:**

```json
[{
  "id": "d4e5f6a7-b8c9-0123-def0-1234567890ab",
  "completed_at": "2026-03-13T14:30:00+09:00",
  "memo": null,
  "care_items": {
    "name": "목욕",
    "icon": "🛁",
    "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}]
```

---

## 8. Dashboard -- 홈 대시보드

단일 요청으로 홈 화면에 필요한 모든 데이터를 가져온다 (N+1 쿼리 방지).

### 8.1 대시보드 데이터 조회

```
POST /functions/v1/dashboard
```

**Request Body:**

```json
{
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `pet_id` | X | uuid | 특정 반려동물만 조회 (없으면 전체) |

**Response `200 OK`:**

```json
{
  "today": [
    {
      "care_item_id": "uuid-1",
      "name": "양치",
      "icon": "🪥",
      "color": "#8B5CF6",
      "pet_name": "초코",
      "pet_id": "uuid-pet-1",
      "next_due_date": "2026-03-13",
      "status": "due",
      "days_overdue": 0
    }
  ],
  "upcoming": [
    {
      "care_item_id": "uuid-2",
      "name": "목욕",
      "icon": "🛁",
      "color": "#8B5CF6",
      "pet_name": "초코",
      "pet_id": "uuid-pet-1",
      "next_due_date": "2026-03-16",
      "status": "pending",
      "days_until": 3
    }
  ],
  "overdue": [
    {
      "care_item_id": "uuid-3",
      "name": "발톱 깎기",
      "icon": "✂️",
      "color": "#EF4444",
      "pet_name": "초코",
      "pet_id": "uuid-pet-1",
      "next_due_date": "2026-03-10",
      "status": "overdue",
      "days_overdue": 3
    }
  ],
  "recent_completions": [
    {
      "care_item_name": "귀 청소",
      "icon": "👂",
      "pet_name": "초코",
      "completed_at": "2026-03-12T10:00:00+09:00"
    }
  ],
  "monthly_expense_total": 185000,
  "pet_count": 2
}
```

**응답 필드 설명:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `today` | array | 오늘 해야 할 항목 (status: `'due'`) |
| `upcoming` | array | 7일 이내 다가오는 항목 (status: `'pending'`) |
| `overdue` | array | 예정일이 지난 항목 (status: `'overdue'`) |
| `recent_completions` | array | 최근 완료한 항목 (최대 5건) |
| `monthly_expense_total` | integer | 이번 달 총 지출 (원) |
| `pet_count` | integer | 등록된 반려동물 수 |

---

## 9. Expenses -- 지출 CRUD

RLS는 `pets.user_id`를 통해 소유권을 확인한다. 금액은 원(KRW) 단위 정수.

### 9.1 지출 기록 추가

```
POST /rest/v1/expenses
```

**Request Body:**

```json
{
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "category_id": "f6a7b8c9-d0e1-2345-f012-3456789abcde",
  "amount": 45000,
  "description": "로얄캐닌 미니 인도어 3kg",
  "expense_date": "2026-03-13",
  "memo": "쿠팡에서 구매"
}
```

**필드 유효성:**

| 필드 | 필수 | 타입 | 제약 |
|------|------|------|------|
| `pet_id` | O | uuid | 유효한 반려동물 ID |
| `category_id` | O | uuid | 유효한 지출 카테고리 ID |
| `amount` | O | integer | 1 이상의 양수 (원 단위) |
| `description` | X | string | 기본값 `''` |
| `expense_date` | O | date | ISO 8601 date |
| `receipt_url` | X | string | 영수증 이미지 URL |
| `memo` | X | string | - |

**Response `201 Created`:** 생성된 레코드

### 9.2 월별 지출 목록 조회

```
GET /rest/v1/expenses?pet_id=eq.{pet_id}&expense_date=gte.2026-03-01&expense_date=lte.2026-03-31&order=expense_date.desc&select=*,expense_categories(name,icon,color)
```

**Response `200 OK`:**

```json
[{
  "id": "g7b8c9d0-e1f2-3456-0123-456789abcdef",
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "category_id": "f6a7b8c9-d0e1-2345-f012-3456789abcde",
  "amount": 45000,
  "description": "로얄캐닌 미니 인도어 3kg",
  "expense_date": "2026-03-13",
  "memo": "쿠팡에서 구매",
  "created_at": "2026-03-13T10:00:00+09:00",
  "updated_at": "2026-03-13T10:00:00+09:00",
  "expense_categories": {
    "name": "사료/간식",
    "icon": "🍖",
    "color": "#F59E0B"
  }
}]
```

### 9.3 지출 수정

```
PATCH /rest/v1/expenses?id=eq.{expense_id}
```

**Request Body:**

```json
{
  "amount": 42000,
  "description": "로얄캐닌 미니 인도어 3kg (할인)"
}
```

**Response `200 OK`:** 수정된 레코드

### 9.4 지출 삭제

```
DELETE /rest/v1/expenses?id=eq.{expense_id}
```

**Response `204 No Content`**

### 9.5 지출 카테고리 조회

기본 카테고리 + 사용자 커스텀 카테고리를 함께 반환한다.

```
GET /rest/v1/expense_categories?order=sort_order.asc
```

**Response `200 OK`:**

```json
[
  { "id": "uuid-1", "name": "사료/간식", "icon": "🍖", "color": "#F59E0B", "is_default": true, "sort_order": 0 },
  { "id": "uuid-2", "name": "병원/의료", "icon": "🏥", "color": "#EF4444", "is_default": true, "sort_order": 1 },
  { "id": "uuid-3", "name": "미용/위생", "icon": "✂️", "color": "#8B5CF6", "is_default": true, "sort_order": 2 },
  { "id": "uuid-4", "name": "용품/장난감", "icon": "🧸", "color": "#3B82F6", "is_default": true, "sort_order": 3 },
  { "id": "uuid-5", "name": "보험", "icon": "🛡️", "color": "#6366F1", "is_default": true, "sort_order": 4 },
  { "id": "uuid-6", "name": "기타", "icon": "📦", "color": "#6B7280", "is_default": true, "sort_order": 5 }
]
```

---

## 10. Statistics -- 통계

### 10.1 지출 통계

```
POST /functions/v1/expense-stats
```

**Request Body:**

```json
{
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "year": 2026,
  "month": 3
}
```

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `pet_id` | X | uuid | 특정 반려동물만 (없으면 전체) |
| `year` | O | integer | 조회 연도 |
| `month` | X | integer | 조회 월 (없으면 연간) |

**Response `200 OK`:**

```json
{
  "period": "2026-03",
  "total": 285000,
  "by_category": [
    {
      "category_id": "uuid-1",
      "category_name": "사료/간식",
      "icon": "🍖",
      "color": "#F59E0B",
      "total": 135000,
      "percentage": 47.4,
      "count": 3
    },
    {
      "category_id": "uuid-2",
      "category_name": "병원/의료",
      "icon": "🏥",
      "color": "#EF4444",
      "total": 80000,
      "percentage": 28.1,
      "count": 1
    },
    {
      "category_id": "uuid-4",
      "category_name": "용품/장난감",
      "icon": "🧸",
      "color": "#3B82F6",
      "total": 70000,
      "percentage": 24.5,
      "count": 2
    }
  ],
  "by_pet": [
    {
      "pet_id": "uuid-pet-1",
      "pet_name": "초코",
      "total": 185000
    },
    {
      "pet_id": "uuid-pet-2",
      "pet_name": "나비",
      "total": 100000
    }
  ],
  "trend": [
    { "month": "2026-01", "total": 220000 },
    { "month": "2026-02", "total": 195000 },
    { "month": "2026-03", "total": 285000 }
  ]
}
```

### 10.2 케어 이행 통계

```
POST /functions/v1/care-stats
```

**Request Body:**

```json
{
  "pet_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "days": 30
}
```

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `pet_id` | X | uuid | 특정 반려동물만 (없으면 전체) |
| `days` | O | integer | 최근 N일 기준 |

**Response `200 OK`:**

```json
{
  "period_days": 30,
  "total_scheduled": 45,
  "completed": 38,
  "skipped": 3,
  "overdue": 4,
  "completion_rate": 84.4,
  "by_category": [
    {
      "category": "hygiene",
      "scheduled": 20,
      "completed": 18,
      "rate": 90.0
    },
    {
      "category": "health",
      "scheduled": 5,
      "completed": 4,
      "rate": 80.0
    }
  ],
  "streak": {
    "current": 5,
    "longest": 12
  }
}
```

---

## 11. Notification Settings -- 알림 설정

사용자당 1개의 알림 설정 레코드가 존재한다 (회원가입 시 자동 생성).

### 11.1 알림 설정 조회

```
GET /rest/v1/notification_settings?user_id=eq.{user_id}
```

**Response `200 OK`:**

```json
[{
  "id": "h8c9d0e1-f2a3-4567-0123-56789abcdef0",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "enabled": true,
  "quiet_start": "22:00:00",
  "quiet_end": "08:00:00",
  "advance_hours": 0,
  "preferred_time": "09:00:00",
  "fcm_token": "fcm_token_string...",
  "created_at": "2026-03-13T00:00:00+09:00",
  "updated_at": "2026-03-13T00:00:00+09:00"
}]
```

### 11.2 알림 설정 수정

```
PATCH /rest/v1/notification_settings?user_id=eq.{user_id}
```

**Request Body:**

```json
{
  "enabled": true,
  "quiet_start": "23:00:00",
  "quiet_end": "07:00:00",
  "advance_hours": 24,
  "preferred_time": "08:00:00"
}
```

**수정 가능 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `enabled` | boolean | 전체 알림 on/off |
| `quiet_start` | time | 방해 금지 시작 (예: `"22:00:00"`) |
| `quiet_end` | time | 방해 금지 종료 (예: `"08:00:00"`) |
| `advance_hours` | integer | 예정일 N시간 전 사전 알림 (0=당일) |
| `preferred_time` | time | 알림 발송 선호 시각 (기본: `"09:00:00"`) |

**Response `200 OK`:** 수정된 레코드

### 11.3 FCM 토큰 등록/갱신

```
POST /functions/v1/register-fcm-token
```

**Request Body:**

```json
{
  "fcm_token": "fcm_device_token_string..."
}
```

**Response `200 OK`:**

```json
{
  "success": true
}
```

---

## 12. Care Templates -- 케어 항목 템플릿

사용자가 항목 추가 시 "뭘 넣어야 하지?" 고민을 줄이기 위한 추천 템플릿 목록.

### 12.1 템플릿 목록 조회

```
GET /functions/v1/care-templates?species=dog
```

| 파라미터 | 필수 | 타입 | 설명 |
|----------|------|------|------|
| `species` | O | string | `'dog'`, `'cat'`, `'other'` |

**Response `200 OK`:**

```json
{
  "templates": [
    {
      "category": "hygiene",
      "category_label": "위생",
      "items": [
        { "name": "목욕", "icon": "🛁", "default_cycle_value": 14, "default_cycle_unit": "day" },
        { "name": "발톱 깎기", "icon": "✂️", "default_cycle_value": 14, "default_cycle_unit": "day" },
        { "name": "귀 청소", "icon": "👂", "default_cycle_value": 7, "default_cycle_unit": "day" },
        { "name": "양치", "icon": "🪥", "default_cycle_value": 1, "default_cycle_unit": "day" },
        { "name": "빗질", "icon": "🖌️", "default_cycle_value": 3, "default_cycle_unit": "day" }
      ]
    },
    {
      "category": "health",
      "category_label": "건강",
      "items": [
        { "name": "예방접종", "icon": "💉", "default_cycle_value": 1, "default_cycle_unit": "month" },
        { "name": "혈액검사", "icon": "🩸", "default_cycle_value": 6, "default_cycle_unit": "month" },
        { "name": "구충", "icon": "💊", "default_cycle_value": 1, "default_cycle_unit": "month" },
        { "name": "심장사상충", "icon": "❤️", "default_cycle_value": 1, "default_cycle_unit": "month" },
        { "name": "체중 측정", "icon": "⚖️", "default_cycle_value": 1, "default_cycle_unit": "month" }
      ]
    },
    {
      "category": "daily",
      "category_label": "생활",
      "items": [
        { "name": "물 갈기", "icon": "💧", "default_cycle_value": 1, "default_cycle_unit": "day" },
        { "name": "사료 주문", "icon": "📦", "default_cycle_value": 1, "default_cycle_unit": "month" },
        { "name": "장난감 세척", "icon": "🧸", "default_cycle_value": 7, "default_cycle_unit": "day" },
        { "name": "하우스 청소", "icon": "🏠", "default_cycle_value": 7, "default_cycle_unit": "day" }
      ]
    }
  ]
}
```

---

## 13. 비즈니스 로직

### 13.1 주기 계산 엔진 (Cycle Calculation Engine)

서비스의 핵심 로직. 케어 완료 시 다음 예정일을 자동으로 계산한다.

**기본 원칙:** 다음 예정일은 **실제 완료 시점** 기준으로 계산한다.

> 예정일 기준으로 계산하면, 3일 늦게 완료한 경우 다음 예정일이 이미 가까워져서 비현실적이다.
> 사용자는 "방금 했으니 다음은 주기만큼 뒤"를 기대한다.

```
next_due_date = completed_at + cycle_interval
```

#### cycle_unit별 계산

```typescript
function calculateNextDueDate(
  completedAt: Date,
  cycleValue: number,
  cycleUnit: 'day' | 'week' | 'month'
): Date {
  const completed = startOfDay(completedAt); // KST 기준 날짜만 사용

  switch (cycleUnit) {
    case 'day':
      return addDays(completed, cycleValue);
      // 예: 3일 주기, 3/13 완료 -> 3/16

    case 'week':
      return addWeeks(completed, cycleValue);
      // 예: 2주 주기, 3/13 완료 -> 3/27

    case 'month':
      return addMonths(completed, cycleValue);
      // 예: 1개월 주기, 3/13 완료 -> 4/13
      // 예: 1개월 주기, 1/31 완료 -> 2/28 (date-fns 자동 처리)

    default:
      throw new Error(`Unknown cycle unit: ${cycleUnit}`);
  }
}
```

#### 완료 처리 전체 플로우 (Pseudocode)

```typescript
async function completeCare(
  careItemId: string,
  completedAt: Date = new Date(),
  memo?: string
): Promise<{ careLog: CareLog; nextSchedule: CareSchedule }> {

  return await db.transaction(async (tx) => {

    // 1. 케어 항목 정보 조회
    const careItem = await tx.query(
      'SELECT * FROM care_items WHERE id = $1 AND is_active = true',
      [careItemId]
    );
    if (!careItem) throw new Error('CARE_ITEM_NOT_FOUND');

    // 2. 현재 활성 스케줄 조회
    const activeSchedule = await tx.query(
      `SELECT * FROM care_schedules
       WHERE care_item_id = $1 AND status IN ('pending', 'due', 'overdue')`,
      [careItemId]
    );

    // 3. 완료 기록 생성
    const careLog = await tx.insert('care_logs', {
      care_item_id: careItemId,
      completed_at: completedAt,
      scheduled_date: activeSchedule?.next_due_date ?? null,
      memo: memo ?? null,
    });

    // 4. 기존 활성 스케줄 완료 처리
    if (activeSchedule) {
      await tx.update('care_schedules', activeSchedule.id, {
        status: 'completed',
      });
    }

    // 5. 다음 예정일 계산
    const nextDueDate = calculateNextDueDate(
      completedAt,
      careItem.cycle_value,
      careItem.cycle_unit
    );

    // 6. 새 스케줄 생성
    const nextSchedule = await tx.insert('care_schedules', {
      care_item_id: careItemId,
      next_due_date: nextDueDate,
      status: 'pending',
    });

    // 7. 알림 스케줄 갱신 (비동기)
    await scheduleNotification(careItemId, nextDueDate);

    return { careLog, nextSchedule };
  });
}
```

#### 엣지 케이스

| 케이스 | 처리 방법 |
|--------|-----------|
| 예정일 이전에 미리 완료 | 완료 시점 기준으로 다음 예정일 계산 (예정일 무시) |
| 예정일 한참 지나서 완료 | 완료 시점 기준으로 계산 (밀린 만큼 벌충 안 함) |
| 하루에 같은 항목 2번 완료 | 허용 -- 마지막 완료 기준으로 다음 스케줄 생성 |
| 주기 변경 | 현재 활성 스케줄의 `next_due_date`를 (마지막 완료일 + 새 주기)로 재계산 |
| 케어 항목 비활성화 | 활성 스케줄을 `'skipped'` 처리, 알림 제거 |
| 케어 항목 재활성화 | 현재 시점 기준으로 새 스케줄 생성 |

### 13.2 스케줄 상태 전이

```
pending -> due       (당일 도달, cron 업데이트)
due     -> overdue   (기한 초과, cron 업데이트)
due     -> completed (완료 체크)
overdue -> completed (완료 체크)
pending -> skipped   (건너뛰기)
due     -> skipped   (건너뛰기)
overdue -> skipped   (건너뛰기)

completed/skipped -> 새 스케줄 pending 자동 생성
```

**Cron Job (매일 KST 00:05):**

```sql
-- pending -> due (오늘 예정)
UPDATE care_schedules
SET status = 'due', updated_at = now()
WHERE status = 'pending'
  AND next_due_date = CURRENT_DATE;

-- due/pending -> overdue (기한 초과)
UPDATE care_schedules
SET status = 'overdue', updated_at = now()
WHERE status IN ('pending', 'due')
  AND next_due_date < CURRENT_DATE;
```

### 13.3 알림 스케줄링

#### 발송 타이밍 결정

```typescript
function calculateNotificationTime(
  nextDueDate: Date,
  userSettings: NotificationSettings
): Date | null {
  if (!userSettings.enabled) return null;

  // 사전 알림 시간 계산
  const notifyDate = subHours(
    setTime(nextDueDate, userSettings.preferred_time),
    userSettings.advance_hours
  );
  // 예: 예정일 3/15, 선호시각 09:00, 사전 24시간
  //     -> 3/14 09:00에 알림

  // 방해 금지 시간 체크
  if (userSettings.quiet_start && userSettings.quiet_end) {
    if (isInQuietHours(notifyDate, userSettings.quiet_start, userSettings.quiet_end)) {
      return setTime(notifyDate, userSettings.quiet_end);
    }
  }

  // 과거 시간이면 무시
  if (isBefore(notifyDate, new Date())) return null;

  return notifyDate;
}
```

#### 알림 메시지 템플릿

| 상황 | title | body |
|------|-------|------|
| 당일 알림 | `🛁 초코 - 목욕` | `오늘 목욕 해줄 시간이에요!` |
| 사전 알림 (D-1) | `🛁 초코 - 목욕` | `내일 목욕 예정이에요. 준비해주세요!` |
| 초과 알림 (D+1) | `🛁 초코 - 목욕` | `목욕 예정일이 1일 지났어요!` |
| 초과 알림 (D+3) | `⚠️ 초코 - 목욕` | `목욕을 3일이나 미루고 있어요. 지금 해주세요!` |
| 오늘의 요약 (아침) | `📋 오늘의 케어` | `초코: 양치, 물 갈기 / 나비: 모래 갈기` |

#### 발송 Cron Job (15분 간격)

```sql
-- 발송 대상 조회
SELECT
  cs.id as schedule_id,
  cs.next_due_date,
  ci.name as care_name,
  ci.icon,
  p.name as pet_name,
  ns.fcm_token,
  ns.preferred_time,
  ns.advance_hours
FROM care_schedules cs
JOIN care_items ci ON ci.id = cs.care_item_id
JOIN pets p ON p.id = ci.pet_id
JOIN notification_settings ns ON ns.user_id = p.user_id
WHERE cs.status IN ('due', 'overdue')
  AND ci.notify_enabled = true
  AND ns.enabled = true
  AND ns.fcm_token IS NOT NULL
  AND cs.next_due_date <= CURRENT_DATE;
```

### 13.4 지출 집계 SQL

#### 월별 카테고리별 지출 합계

```sql
SELECT
  ec.id as category_id,
  ec.name as category_name,
  ec.icon,
  ec.color,
  COALESCE(SUM(e.amount), 0) as total,
  COUNT(e.id) as count
FROM expense_categories ec
LEFT JOIN expenses e ON e.category_id = ec.id
  AND e.expense_date >= '2026-03-01'
  AND e.expense_date <= '2026-03-31'
  AND e.pet_id = ANY($1)           -- 선택된 반려동물 ID 배열
WHERE ec.user_id = $2 OR ec.is_default = true
GROUP BY ec.id, ec.name, ec.icon, ec.color, ec.sort_order
ORDER BY ec.sort_order;
```

#### 반려동물별 월간 지출

```sql
SELECT
  p.id as pet_id,
  p.name as pet_name,
  COALESCE(SUM(e.amount), 0) as total
FROM pets p
LEFT JOIN expenses e ON e.pet_id = p.id
  AND e.expense_date >= '2026-03-01'
  AND e.expense_date <= '2026-03-31'
WHERE p.user_id = $1 AND p.archived_at IS NULL
GROUP BY p.id, p.name
ORDER BY total DESC;
```

#### 최근 6개월 월별 지출 추이

```sql
SELECT
  TO_CHAR(e.expense_date, 'YYYY-MM') as month,
  SUM(e.amount) as total
FROM expenses e
JOIN pets p ON p.id = e.pet_id
WHERE p.user_id = $1
  AND e.expense_date >= (CURRENT_DATE - INTERVAL '6 months')
GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')
ORDER BY month;
```

---

> **문서 끝**
>
> 이 API 명세서는 Petroutine MVP 기술 명세서(spec.md)의 섹션 4, 5를 기반으로 작성되었습니다.
> 데이터베이스 스키마는 `docs/erd.md`, 기술 스택 상세는 `docs/tech-stack.md`를 참조하세요.
