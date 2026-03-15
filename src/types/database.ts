// Firestore 문서 타입 정의
// 각 컬렉션의 문서 구조를 정의

export type CareCategory = 'hygiene' | 'health' | 'daily' | 'custom';
export type CycleUnit = 'day' | 'week' | 'month';
export type ScheduleStatus = 'pending' | 'due' | 'overdue' | 'completed' | 'skipped';
export type Species = 'dog' | 'cat' | 'other';
export type Gender = 'male' | 'female' | 'unknown';

export interface UserDoc {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface PetDoc {
  userId: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  gender: Gender | null;
  neutered: boolean;
  weightKg: number | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface CareItemDoc {
  petId: string;
  userId: string;
  category: CareCategory;
  name: string;
  cycleValue: number;
  cycleUnit: CycleUnit;
  icon: string;
  color: string;
  isActive: boolean;
  notifyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareLogDoc {
  careItemId: string;
  userId: string;
  completedAt: string;
  scheduledDate: string | null;
  memo: string | null;
  createdAt: string;
}

export interface CareScheduleDoc {
  careItemId: string;
  userId: string;
  nextDueDate: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDoc {
  petId: string;
  userId: string;
  categoryId: string;
  amount: number;
  description: string;
  expenseDate: string;
  receiptUrl: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryDoc {
  userId: string | null;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface NotificationSettingsDoc {
  globalEnabled: boolean;
  notifyTime: string; // "HH:mm"
  updatedAt: string;
}

export interface FcmTokenDoc {
  token: string;
  deviceInfo: string;
  createdAt: string;
  lastActiveAt: string;
}
