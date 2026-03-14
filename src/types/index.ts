export type { CareCategory, CycleUnit, ScheduleStatus, Species, Gender } from './database';

// 도메인 타입 (UI에서 사용)
export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string | null;
  birthDate: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
  neutered: boolean;
  weightKg: number | null;
  avatarUrl: string | null;
}

export interface CareItem {
  id: string;
  petId: string;
  category: 'hygiene' | 'health' | 'daily' | 'custom';
  name: string;
  cycleValue: number;
  cycleUnit: 'day' | 'week' | 'month';
  icon: string;
  color: string;
  isActive: boolean;
  notifyEnabled: boolean;
  schedule: CareSchedule | null;
  lastLog: CareLog | null;
}

export interface CareSchedule {
  id: string;
  careItemId: string;
  nextDueDate: string;
  status: 'pending' | 'due' | 'overdue' | 'completed' | 'skipped';
}

export interface CareLog {
  id: string;
  careItemId: string;
  completedAt: string;
  scheduledDate: string | null;
  memo: string | null;
}

export interface Expense {
  id: string;
  petId: string | null;
  categoryId: string;
  amount: number;
  description: string;
  expenseDate: string;
  memo: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface MonthlyStats {
  month: string;
  totalAmount: number;
  byCategory: { categoryId: string; name: string; amount: number; icon: string; color: string }[];
  byPet: { petId: string; name: string; amount: number }[];
}
