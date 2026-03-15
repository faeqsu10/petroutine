// 하단 플로팅 네비 영역을 위한 콘텐츠 패딩
export const BOTTOM_NAV_PADDING = 'pb-32'; // 128px — 플로팅 네비(~90px) + 여유

export const PRESET_COLORS = ['#FF7E5F', '#FFB347', '#48C6EF', '#6B8DD6', '#764BA2', '#6A11CB'];
export const PRESET_ICONS = ['🛁', '💊', '💉', '✂️', '🦷', '🐾', '🍖', '🏥', '🧴', '👁️', '🦴', '🚿'];

// 지출 카테고리용 프리셋 (케어 프리셋과 별도 도메인)
export const EXPENSE_PRESET_ICONS = ['🐾', '💊', '🏥', '✂️', '🛁', '🧸', '🎀', '🍖', '🦮', '🐠', '🌿', '🚗'];
export const EXPENSE_PRESET_COLORS = ['#6366f1', '#f97316', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b'];

export const CARE_TEMPLATES = [
  // 위생
  { name: '목욕', category: 'hygiene', icon: '🛁', cycleValue: 2, cycleUnit: 'week' },
  { name: '발톱 깎기', category: 'hygiene', icon: '✂️', cycleValue: 2, cycleUnit: 'week' },
  { name: '귀 청소', category: 'hygiene', icon: '👂', cycleValue: 1, cycleUnit: 'week' },
  { name: '양치', category: 'hygiene', icon: '🦷', cycleValue: 1, cycleUnit: 'day' },
  { name: '빗질', category: 'hygiene', icon: '🧴', cycleValue: 2, cycleUnit: 'day' },
  // 건강
  { name: '심장사상충 약', category: 'health', icon: '💊', cycleValue: 1, cycleUnit: 'month' },
  { name: '외부 기생충 약', category: 'health', icon: '🛡️', cycleValue: 1, cycleUnit: 'month' },
  { name: '종합 예방접종', category: 'health', icon: '💉', cycleValue: 1, cycleUnit: 'month' },
  { name: '건강 검진', category: 'health', icon: '🏥', cycleValue: 6, cycleUnit: 'month' },
  { name: '체중 측정', category: 'health', icon: '⚖️', cycleValue: 1, cycleUnit: 'month' },
  // 생활
  { name: '사료 구매', category: 'daily', icon: '🍖', cycleValue: 1, cycleUnit: 'month' },
  { name: '모래/패드 교체', category: 'daily', icon: '🚿', cycleValue: 1, cycleUnit: 'week' },
  { name: '장난감 교체', category: 'daily', icon: '🧸', cycleValue: 1, cycleUnit: 'month' },
  { name: '산책', category: 'daily', icon: '🐾', cycleValue: 1, cycleUnit: 'day' },
  { name: '간식 구매', category: 'daily', icon: '🦴', cycleValue: 2, cycleUnit: 'week' },
] as const;

export type CareTemplate = (typeof CARE_TEMPLATES)[number];

export const PRODUCT_CATEGORIES = {
  food: '🍖 사료',
  treat: '🦴 간식',
  supply: '🧸 용품',
  hygiene: '🧴 위생',
};
