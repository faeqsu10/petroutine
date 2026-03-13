-- Petroutine Initial Schema
-- 반려동물 케어 주기 관리 + 가계부

-- ===========================================
-- Custom Types
-- ===========================================
CREATE TYPE care_category AS ENUM ('hygiene', 'health', 'daily', 'custom');
CREATE TYPE cycle_unit AS ENUM ('day', 'week', 'month');
CREATE TYPE schedule_status AS ENUM ('pending', 'due', 'overdue', 'completed', 'skipped');

-- ===========================================
-- Tables
-- ===========================================

-- 1. users (보호자 프로필)
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  timezone    TEXT NOT NULL DEFAULT 'Asia/Seoul',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON public.users(email);

-- 2. pets (반려동물)
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
  archived_at TIMESTAMPTZ
);
CREATE INDEX idx_pets_user_id ON public.pets(user_id);
CREATE INDEX idx_pets_user_active ON public.pets(user_id) WHERE archived_at IS NULL;

-- 3. care_items (케어 항목 정의)
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
CREATE INDEX idx_care_items_pet_id ON public.care_items(pet_id);
CREATE INDEX idx_care_items_pet_active ON public.care_items(pet_id) WHERE is_active = true;

-- 4. care_logs (완료 기록)
CREATE TABLE public.care_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_item_id    UUID NOT NULL REFERENCES public.care_items(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_date  DATE,
  memo            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_care_logs_item_id ON public.care_logs(care_item_id);
CREATE INDEX idx_care_logs_completed ON public.care_logs(care_item_id, completed_at DESC);

-- 5. care_schedules (다음 예정일)
CREATE TABLE public.care_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_item_id    UUID NOT NULL REFERENCES public.care_items(id) ON DELETE CASCADE,
  next_due_date   DATE NOT NULL,
  status          schedule_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_care_schedules_active ON public.care_schedules(care_item_id)
  WHERE status IN ('pending', 'due', 'overdue');
CREATE INDEX idx_care_schedules_due_date ON public.care_schedules(next_due_date)
  WHERE status IN ('pending', 'due', 'overdue');

-- 6. expense_categories (지출 카테고리)
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
CREATE INDEX idx_expense_categories_user ON public.expense_categories(user_id);

-- 7. expenses (지출 기록)
CREATE TABLE public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.expense_categories(id),
  amount          INTEGER NOT NULL CHECK (amount > 0),
  description     TEXT NOT NULL DEFAULT '',
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  memo            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_pet_id ON public.expenses(pet_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_pet_date ON public.expenses(pet_id, expense_date);

-- 8. notification_settings (알림 설정)
CREATE TABLE public.notification_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  quiet_start     TIME,
  quiet_end       TIME,
  advance_hours   INTEGER NOT NULL DEFAULT 0,
  preferred_time  TIME NOT NULL DEFAULT '09:00',
  fcm_token       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- Row Level Security
-- ===========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pets_all_own" ON public.pets FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.care_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_items_own" ON public.care_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pets WHERE pets.id = care_items.pet_id AND pets.user_id = auth.uid())
);

ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_logs_own" ON public.care_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.care_items ci
    JOIN public.pets p ON p.id = ci.pet_id
    WHERE ci.id = care_logs.care_item_id AND p.user_id = auth.uid()
  )
);

ALTER TABLE public.care_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_schedules_own" ON public.care_schedules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.care_items ci
    JOIN public.pets p ON p.id = ci.pet_id
    WHERE ci.id = care_schedules.care_item_id AND p.user_id = auth.uid()
  )
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_categories_read" ON public.expense_categories
  FOR SELECT USING (user_id = auth.uid() OR is_default = true);
CREATE POLICY "expense_categories_manage" ON public.expense_categories
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_own" ON public.expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pets WHERE pets.id = expenses.pet_id AND pets.user_id = auth.uid())
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_settings_own" ON public.notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- Triggers
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.care_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.care_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auth 회원가입 시 자동 프로필 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', '')
  );
  INSERT INTO public.notification_settings (user_id) VALUES (NEW.id);
  -- 기본 지출 카테고리 복사
  INSERT INTO public.expense_categories (user_id, name, icon, color, is_default, sort_order)
  SELECT NEW.id, name, icon, color, false, sort_order
  FROM public.expense_categories WHERE is_default = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- Seed Data: 기본 지출 카테고리
-- ===========================================
INSERT INTO public.expense_categories (name, icon, color, is_default, sort_order) VALUES
  ('사료/간식', '🍖', '#F59E0B', true, 1),
  ('병원/의료', '🏥', '#EF4444', true, 2),
  ('미용/위생', '✂️', '#8B5CF6', true, 3),
  ('용품/장난감', '🧸', '#3B82F6', true, 4),
  ('보험', '🛡️', '#6366F1', true, 5),
  ('기타', '📦', '#6B7280', true, 6);
