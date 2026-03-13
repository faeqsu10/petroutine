import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { addDays, addWeeks, addMonths, format, differenceInDays, isToday, isBefore, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CycleUnit, ScheduleStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 주기 기반 다음 예정일 계산 */
export function calculateNextDueDate(
  completedAt: Date,
  cycleValue: number,
  cycleUnit: CycleUnit,
): Date {
  switch (cycleUnit) {
    case 'day':
      return addDays(completedAt, cycleValue);
    case 'week':
      return addWeeks(completedAt, cycleValue);
    case 'month':
      return addMonths(completedAt, cycleValue);
  }
}

/** 예정일 기준 긴급도 상태 판정 */
export function getScheduleUrgency(nextDueDate: string): ScheduleStatus {
  const due = startOfDay(new Date(nextDueDate));
  const today = startOfDay(new Date());
  const daysUntil = differenceInDays(due, today);

  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'due';
  return 'pending';
}

/** 긴급도별 색상 */
export function getUrgencyColor(status: ScheduleStatus): string {
  switch (status) {
    case 'overdue':
      return '#EF4444'; // 빨강
    case 'due':
      return '#F59E0B'; // 노랑
    case 'pending':
      return '#10B981'; // 초록
    default:
      return '#6B7280'; // 회색
  }
}

/** 한국어 날짜 포맷 */
export function formatDate(date: string | Date, pattern = 'M월 d일'): string {
  return format(new Date(date), pattern, { locale: ko });
}

/** D-day 텍스트 */
export function getDdayText(nextDueDate: string): string {
  const days = differenceInDays(startOfDay(new Date(nextDueDate)), startOfDay(new Date()));
  if (days < 0) return `${Math.abs(days)}일 지남`;
  if (days === 0) return '오늘';
  return `D-${days}`;
}

/** Date → 'YYYY-MM-DD' (로컬 시간 기준, UTC 변환 방지) */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 금액 포맷 (원) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}
