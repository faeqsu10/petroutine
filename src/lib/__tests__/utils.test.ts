import { describe, it, expect } from 'vitest';
import {
  calculateNextDueDate,
  getScheduleUrgency,
  getUrgencyColor,
  formatDate,
  getDdayText,
  formatCurrency,
  toLocalDateStr,
  cn,
  chunkArray,
} from '@/lib/utils';

/** 로컬 타임존 기준 YYYY-MM-DD 문자열 생성 (toISOString은 UTC 기준이라 timezone 차이로 날짜가 밀림) */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================================
// calculateNextDueDate: 주기 기반 다음 예정일 계산 (핵심 비즈니스 로직)
// ============================================================
describe('calculateNextDueDate', () => {
  // --- 기본 케이스: day 주기 ---
  describe('day 주기', () => {
    it('1일 주기 시 다음날 날짜를 반환한다', () => {
      const base = new Date('2025-03-01T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'day');
      expect(result).toEqual(new Date('2025-03-02T10:00:00Z'));
    });

    it('7일 주기 시 7일 후 날짜를 반환한다', () => {
      const base = new Date('2025-03-01T10:00:00Z');
      const result = calculateNextDueDate(base, 7, 'day');
      expect(result).toEqual(new Date('2025-03-08T10:00:00Z'));
    });

    it('365일 주기 시 예방접종처럼 1년 후 날짜를 반환한다', () => {
      const base = new Date('2025-01-15T10:00:00Z');
      const result = calculateNextDueDate(base, 365, 'day');
      expect(result).toEqual(new Date('2026-01-15T10:00:00Z'));
    });
  });

  // --- 기본 케이스: week 주기 ---
  describe('week 주기', () => {
    it('1주 주기 시 7일 후 날짜를 반환한다', () => {
      const base = new Date('2025-03-01T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'week');
      expect(result).toEqual(new Date('2025-03-08T10:00:00Z'));
    });

    it('2주 주기 시 14일 후 날짜를 반환한다', () => {
      const base = new Date('2025-03-01T10:00:00Z');
      const result = calculateNextDueDate(base, 2, 'week');
      expect(result).toEqual(new Date('2025-03-15T10:00:00Z'));
    });

    it('4주 주기 시 28일 후 날짜를 반환한다', () => {
      const base = new Date('2025-06-01T10:00:00Z');
      const result = calculateNextDueDate(base, 4, 'week');
      expect(result).toEqual(new Date('2025-06-29T10:00:00Z'));
    });
  });

  // --- 기본 케이스: month 주기 ---
  describe('month 주기', () => {
    it('1개월 주기 시 다음달 같은 날짜를 반환한다', () => {
      const base = new Date('2025-03-15T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2025-04-15T10:00:00Z'));
    });

    it('3개월 주기 시 3개월 후 날짜를 반환한다', () => {
      const base = new Date('2025-01-10T10:00:00Z');
      const result = calculateNextDueDate(base, 3, 'month');
      expect(result).toEqual(new Date('2025-04-10T10:00:00Z'));
    });

    it('12개월 주기 시 1년 후 날짜를 반환한다', () => {
      const base = new Date('2025-06-15T10:00:00Z');
      const result = calculateNextDueDate(base, 12, 'month');
      expect(result).toEqual(new Date('2026-06-15T10:00:00Z'));
    });
  });

  // --- 엣지 케이스: 월말 처리 ---
  describe('월말 처리 (date-fns addMonths 동작)', () => {
    it('1월 31일 + 1개월 = 2월 28일 (비윤년)', () => {
      const base = new Date('2025-01-31T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      // date-fns addMonths는 월말을 해당 월의 마지막 날로 clamp
      expect(result).toEqual(new Date('2025-02-28T10:00:00Z'));
    });

    it('1월 31일 + 1개월 = 2월 29일 (윤년)', () => {
      const base = new Date('2024-01-31T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2024-02-29T10:00:00Z'));
    });

    it('3월 31일 + 1개월 = 4월 30일 (30일 달)', () => {
      const base = new Date('2025-03-31T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2025-04-30T10:00:00Z'));
    });

    it('8월 31일 + 1개월 = 9월 30일', () => {
      const base = new Date('2025-08-31T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2025-09-30T10:00:00Z'));
    });

    it('1월 30일 + 1개월 = 2월 28일 (비윤년)', () => {
      const base = new Date('2025-01-30T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2025-02-28T10:00:00Z'));
    });

    it('1월 29일 + 1개월 = 2월 28일 (비윤년)', () => {
      const base = new Date('2025-01-29T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2025-02-28T10:00:00Z'));
    });

    it('1월 29일 + 1개월 = 2월 29일 (윤년)', () => {
      const base = new Date('2024-01-29T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2024-02-29T10:00:00Z'));
    });
  });

  // --- 엣지 케이스: 윤년 ---
  describe('윤년 처리', () => {
    it('2월 29일(윤년) + 1개월 = 3월 29일', () => {
      const base = new Date('2024-02-29T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'month');
      expect(result).toEqual(new Date('2024-03-29T10:00:00Z'));
    });

    it('2월 29일(윤년) + 12개월 = 다음해 2월 28일', () => {
      const base = new Date('2024-02-29T10:00:00Z');
      const result = calculateNextDueDate(base, 12, 'month');
      expect(result).toEqual(new Date('2025-02-28T10:00:00Z'));
    });

    it('2월 28일(비윤년) + 1일 = 3월 1일', () => {
      const base = new Date('2025-02-28T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'day');
      expect(result).toEqual(new Date('2025-03-01T10:00:00Z'));
    });

    it('2월 29일(윤년) + 1일 = 3월 1일', () => {
      const base = new Date('2024-02-29T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'day');
      expect(result).toEqual(new Date('2024-03-01T10:00:00Z'));
    });

    it('윤년 2월 29일 + 365일 = 다음해 2월 28일', () => {
      const base = new Date('2024-02-29T10:00:00Z');
      const result = calculateNextDueDate(base, 365, 'day');
      expect(result).toEqual(new Date('2025-02-28T10:00:00Z'));
    });
  });

  // --- 엣지 케이스: 연도 넘어가는 경우 ---
  describe('연도 경계 처리', () => {
    it('12월 25일 + 14일 = 다음해 1월 8일', () => {
      const base = new Date('2025-12-25T10:00:00Z');
      const result = calculateNextDueDate(base, 14, 'day');
      expect(result).toEqual(new Date('2026-01-08T10:00:00Z'));
    });

    it('12월 1일 + 2개월 = 다음해 2월 1일', () => {
      const base = new Date('2025-12-01T10:00:00Z');
      const result = calculateNextDueDate(base, 2, 'month');
      expect(result).toEqual(new Date('2026-02-01T10:00:00Z'));
    });

    it('12월 31일 + 1일 = 다음해 1월 1일', () => {
      const base = new Date('2025-12-31T10:00:00Z');
      const result = calculateNextDueDate(base, 1, 'day');
      expect(result).toEqual(new Date('2026-01-01T10:00:00Z'));
    });

    it('12월 15일 + 3주 = 다음해 1월 5일', () => {
      const base = new Date('2025-12-15T10:00:00Z');
      const result = calculateNextDueDate(base, 3, 'week');
      expect(result).toEqual(new Date('2026-01-05T10:00:00Z'));
    });

    it('11월 30일 + 3개월 = 다음해 2월 28일 (비윤년)', () => {
      const base = new Date('2024-11-30T10:00:00Z');
      const result = calculateNextDueDate(base, 3, 'month');
      expect(result).toEqual(new Date('2025-02-28T10:00:00Z'));
    });
  });

  // --- 엣지 케이스: 큰 주기 값 ---
  describe('큰 주기 값', () => {
    it('180일 주기 (심장사상충 예방)', () => {
      const base = new Date('2025-01-01T10:00:00Z');
      const result = calculateNextDueDate(base, 180, 'day');
      expect(result).toEqual(new Date('2025-06-30T10:00:00Z'));
    });

    it('52주 주기 (연간 정기검진)', () => {
      const base = new Date('2025-01-01T10:00:00Z');
      const result = calculateNextDueDate(base, 52, 'week');
      expect(result).toEqual(new Date('2025-12-31T10:00:00Z'));
    });

    it('24개월 주기 (2년 주기 검진)', () => {
      const base = new Date('2025-03-15T10:00:00Z');
      const result = calculateNextDueDate(base, 24, 'month');
      expect(result).toEqual(new Date('2027-03-15T10:00:00Z'));
    });
  });

  // --- 시간 보존 확인 ---
  describe('시간(time) 보존', () => {
    it('시간 정보가 그대로 유지된다', () => {
      const base = new Date('2025-03-01T14:30:45.123Z');
      const result = calculateNextDueDate(base, 1, 'day');
      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCSeconds()).toBe(45);
      expect(result.getUTCMilliseconds()).toBe(123);
    });
  });
});

// ============================================================
// getScheduleUrgency: 예정일 기준 긴급도 상태 판정
// ============================================================
describe('getScheduleUrgency', () => {
  it('과거 날짜는 overdue를 반환한다', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getScheduleUrgency(toLocalDateStr(yesterday))).toBe('overdue');
  });

  it('오늘 날짜는 due를 반환한다', () => {
    expect(getScheduleUrgency(toLocalDateStr(new Date()))).toBe('due');
  });

  it('미래 날짜는 pending을 반환한다', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getScheduleUrgency(toLocalDateStr(tomorrow))).toBe('pending');
  });

  it('7일 전 날짜는 overdue를 반환한다', () => {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    expect(getScheduleUrgency(toLocalDateStr(past))).toBe('overdue');
  });

  it('30일 후 날짜는 pending을 반환한다', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    expect(getScheduleUrgency(toLocalDateStr(future))).toBe('pending');
  });
});

// ============================================================
// getUrgencyColor: 긴급도별 색상
// ============================================================
describe('getUrgencyColor', () => {
  it('overdue 상태는 빨간색을 반환한다', () => {
    expect(getUrgencyColor('overdue')).toBe('#EF4444');
  });

  it('due 상태는 노란색을 반환한다', () => {
    expect(getUrgencyColor('due')).toBe('#F59E0B');
  });

  it('pending 상태는 초록색을 반환한다', () => {
    expect(getUrgencyColor('pending')).toBe('#10B981');
  });

  it('알 수 없는 상태는 회색을 반환한다', () => {
    // completed, skipped 등 정의되지 않은 상태
    expect(getUrgencyColor('completed' as 'overdue')).toBe('#6B7280');
    expect(getUrgencyColor('skipped' as 'overdue')).toBe('#6B7280');
  });
});

// ============================================================
// formatDate: 한국어 날짜 포맷
// ============================================================
describe('formatDate', () => {
  it('기본 패턴으로 날짜를 포맷한다 (M월 d일)', () => {
    const result = formatDate('2025-03-15');
    expect(result).toBe('3월 15일');
  });

  it('Date 객체도 입력으로 받을 수 있다', () => {
    const result = formatDate(new Date('2025-12-25'));
    expect(result).toContain('12월');
    expect(result).toContain('25일');
  });

  it('커스텀 패턴을 지정할 수 있다', () => {
    const result = formatDate('2025-03-15', 'yyyy년 M월 d일');
    expect(result).toBe('2025년 3월 15일');
  });

  it('1월 1일 형식이 올바르다', () => {
    const result = formatDate('2025-01-01');
    expect(result).toBe('1월 1일');
  });
});

// ============================================================
// getDdayText: D-day 텍스트
// ============================================================
describe('getDdayText', () => {
  it('오늘 날짜는 "오늘"을 반환한다', () => {
    expect(getDdayText(toLocalDateStr(new Date()))).toBe('오늘');
  });

  it('과거 날짜는 "N일 지남"을 반환한다', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(getDdayText(toLocalDateStr(past))).toBe('3일 지남');
  });

  it('미래 날짜는 "D-N"을 반환한다', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDdayText(toLocalDateStr(future))).toBe('D-5');
  });

  it('1일 전은 "1일 지남"을 반환한다', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getDdayText(toLocalDateStr(yesterday))).toBe('1일 지남');
  });

  it('내일은 "D-1"을 반환한다', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getDdayText(toLocalDateStr(tomorrow))).toBe('D-1');
  });

  it('100일 후 미래 날짜는 "D-100"을 반환한다', () => {
    const far = new Date();
    far.setDate(far.getDate() + 100);
    expect(getDdayText(toLocalDateStr(far))).toBe('D-100');
  });

  it('365일 전 과거 날짜는 "365일 지남"을 반환한다', () => {
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 365);
    expect(getDdayText(toLocalDateStr(longAgo))).toBe('365일 지남');
  });
});

// ============================================================
// formatCurrency: 금액 포맷
// ============================================================
describe('formatCurrency', () => {
  it('천 단위 구분자를 추가하고 "원"을 붙인다', () => {
    expect(formatCurrency(15000)).toBe('15,000원');
  });

  it('0원을 올바르게 포맷한다', () => {
    expect(formatCurrency(0)).toBe('0원');
  });

  it('백만원 이상 금액을 올바르게 포맷한다', () => {
    expect(formatCurrency(1234567)).toBe('1,234,567원');
  });

  it('100원 미만 금액도 올바르게 포맷한다', () => {
    expect(formatCurrency(50)).toBe('50원');
  });

  it('천원 단위 금액을 올바르게 포맷한다', () => {
    expect(formatCurrency(1000)).toBe('1,000원');
  });

  it('음수 금액을 올바르게 포맷한다', () => {
    expect(formatCurrency(-5000)).toBe('-5,000원');
  });

  it('소수점 금액을 처리한다', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234');
    expect(result).toContain('원');
  });

  it('매우 큰 금액(억 단위)을 포맷한다', () => {
    expect(formatCurrency(100000000)).toBe('100,000,000원');
  });
});

// ============================================================
// toLocalDateStr: 로컬 날짜 문자열 변환
// ============================================================
describe('toLocalDateStr', () => {
  it('Date를 YYYY-MM-DD 형식의 로컬 날짜 문자열로 변환한다', () => {
    const date = new Date(2026, 2, 14); // 2026-03-14 로컬
    expect(toLocalDateStr(date)).toBe('2026-03-14');
  });

  it('한 자리 월/일에 0을 패딩한다', () => {
    const date = new Date(2026, 0, 5); // 2026-01-05
    expect(toLocalDateStr(date)).toBe('2026-01-05');
  });

  it('12월 31일을 올바르게 처리한다', () => {
    const date = new Date(2026, 11, 31); // 2026-12-31
    expect(toLocalDateStr(date)).toBe('2026-12-31');
  });

  it('자정 근처에서도 UTC 변환 없이 로컬 날짜를 반환한다', () => {
    // 00:05 로컬 시간 — toISOString()이면 전날로 밀릴 수 있음
    const date = new Date(2026, 2, 14, 0, 5, 0);
    expect(toLocalDateStr(date)).toBe('2026-03-14');
  });

  it('1월 1일을 올바르게 처리한다', () => {
    const date = new Date(2026, 0, 1);
    expect(toLocalDateStr(date)).toBe('2026-01-01');
  });
});

// ============================================================
// cn: 클래스 이름 유틸리티
// ============================================================
describe('cn', () => {
  it('여러 클래스를 병합한다', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('조건부 클래스를 처리한다', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toBe('base visible');
  });

  it('Tailwind 충돌 클래스를 병합한다', () => {
    const result = cn('px-4', 'px-6');
    expect(result).toBe('px-6');
  });

  it('빈 입력을 처리한다', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

// ============================================================
// chunkArray: Firestore in 쿼리 30개 제한 대응 배열 분할
// ============================================================
describe('chunkArray', () => {
  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(chunkArray([], 30)).toEqual([]);
  });

  it('배열 크기가 chunk 크기보다 작으면 단일 청크를 반환한다', () => {
    const arr = [1, 2, 3];
    expect(chunkArray(arr, 30)).toEqual([[1, 2, 3]]);
  });

  it('정확히 chunk 크기와 같으면 단일 청크를 반환한다', () => {
    const arr = Array.from({ length: 30 }, (_, i) => i);
    const result = chunkArray(arr, 30);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(30);
  });

  it('chunk 크기보다 크면 여러 청크로 분할한다', () => {
    const arr = Array.from({ length: 31 }, (_, i) => i);
    const result = chunkArray(arr, 30);
    expect(result).toHaveLength(2);
  });

  it('31개를 30개씩 분할하면 [30, 1] 청크를 반환한다', () => {
    const arr = Array.from({ length: 31 }, (_, i) => i);
    const result = chunkArray(arr, 30);
    expect(result[0]).toHaveLength(30);
    expect(result[1]).toHaveLength(1);
  });

  it('60개를 30개씩 분할하면 [30, 30] 청크를 반환한다', () => {
    const arr = Array.from({ length: 60 }, (_, i) => i);
    const result = chunkArray(arr, 30);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(30);
    expect(result[1]).toHaveLength(30);
  });

  it('chunk 크기가 1이면 각 요소가 개별 청크가 된다', () => {
    const arr = ['a', 'b', 'c'];
    const result = chunkArray(arr, 1);
    expect(result).toEqual([['a'], ['b'], ['c']]);
  });
});
