// Supabase 자동 생성 타입 (supabase gen types typescript로 갱신)
// 초기 placeholder — 실제 타입은 Supabase CLI로 생성

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CareCategory = 'hygiene' | 'health' | 'daily' | 'custom';
export type CycleUnit = 'day' | 'week' | 'month';
export type ScheduleStatus = 'pending' | 'due' | 'overdue' | 'completed' | 'skipped';
export type Species = 'dog' | 'cat' | 'other';
export type Gender = 'male' | 'female' | 'unknown';

export interface UsersRow {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface PetsRow {
  id: string;
  user_id: string;
  name: string;
  species: Species;
  breed: string | null;
  birth_date: string | null;
  gender: Gender | null;
  neutered: boolean;
  weight_kg: number | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CareItemsRow {
  id: string;
  pet_id: string;
  category: CareCategory;
  name: string;
  cycle_value: number;
  cycle_unit: CycleUnit;
  icon: string;
  color: string;
  is_active: boolean;
  notify_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareLogsRow {
  id: string;
  care_item_id: string;
  completed_at: string;
  scheduled_date: string | null;
  memo: string | null;
  created_at: string;
}

export interface CareSchedulesRow {
  id: string;
  care_item_id: string;
  next_due_date: string;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
}

export interface ExpensesRow {
  id: string;
  pet_id: string;
  category_id: string;
  amount: number;
  description: string;
  expense_date: string;
  receipt_url: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategoriesRow {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface NotificationSettingsRow {
  id: string;
  user_id: string;
  enabled: boolean;
  quiet_start: string | null;
  quiet_end: string | null;
  advance_hours: number;
  preferred_time: string;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UsersRow;
        Insert: Partial<UsersRow> & Pick<UsersRow, 'id' | 'email'>;
        Update: Partial<UsersRow>;
      };
      pets: {
        Row: PetsRow;
        Insert: Partial<PetsRow> & Pick<PetsRow, 'user_id' | 'name' | 'species'>;
        Update: Partial<PetsRow>;
      };
      care_items: {
        Row: CareItemsRow;
        Insert: Partial<CareItemsRow> & Pick<CareItemsRow, 'pet_id' | 'name' | 'cycle_value'>;
        Update: Partial<CareItemsRow>;
      };
      care_logs: {
        Row: CareLogsRow;
        Insert: Partial<CareLogsRow> & Pick<CareLogsRow, 'care_item_id'>;
        Update: Partial<CareLogsRow>;
      };
      care_schedules: {
        Row: CareSchedulesRow;
        Insert: Partial<CareSchedulesRow> & Pick<CareSchedulesRow, 'care_item_id' | 'next_due_date'>;
        Update: Partial<CareSchedulesRow>;
      };
      expenses: {
        Row: ExpensesRow;
        Insert: Partial<ExpensesRow> & Pick<ExpensesRow, 'pet_id' | 'category_id' | 'amount'>;
        Update: Partial<ExpensesRow>;
      };
      expense_categories: {
        Row: ExpenseCategoriesRow;
        Insert: Partial<ExpenseCategoriesRow> & Pick<ExpenseCategoriesRow, 'name'>;
        Update: Partial<ExpenseCategoriesRow>;
      };
      notification_settings: {
        Row: NotificationSettingsRow;
        Insert: Partial<NotificationSettingsRow> & Pick<NotificationSettingsRow, 'user_id'>;
        Update: Partial<NotificationSettingsRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      care_category: CareCategory;
      cycle_unit: CycleUnit;
      schedule_status: ScheduleStatus;
    };
  };
}
