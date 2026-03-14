export const PRESET_COLORS = ['#FF7E5F', '#FFB347', '#48C6EF', '#6B8DD6', '#764BA2', '#6A11CB'];
export const PRESET_ICONS = ['🛁', '💊', '💉', '✂️', '🦷', '🐾', '🍖', '🏥', '🧴', '👁️', '🦴', '🚿'];

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
