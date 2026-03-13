import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ============================================================
// 훅 모킹 — vi.mock은 호이스팅됨
// ============================================================
const mockUpdateCareItem = vi.fn();
const mockDeleteCareItem = vi.fn();

vi.mock('@/hooks/use-care-items', () => ({
  useUpdateCareItem: () => ({
    mutate: mockUpdateCareItem,
    isPending: false,
  }),
  useDeleteCareItem: () => ({
    mutate: mockDeleteCareItem,
    isPending: false,
  }),
}));

// cn은 실제 구현 사용 (클래스명 병합만 하므로 안전)
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) =>
    classes.filter(Boolean).join(' '),
}));

// ============================================================
// 테스트 대상 임포트 (모킹 이후)
// ============================================================
import { CareEditSheet } from '@/components/care/edit-sheet';
import type { CareItem } from '@/types';

// ============================================================
// 픽스처
// ============================================================
function makeCareItem(overrides: Partial<CareItem> = {}): CareItem {
  return {
    id: 'care-item-1',
    petId: 'pet-1',
    category: 'hygiene',
    name: '목욕',
    cycleValue: 7,
    cycleUnit: 'day',
    icon: '🛁',
    color: '#6366F1',
    isActive: true,
    notifyEnabled: true,
    schedule: null,
    lastLog: null,
    ...overrides,
  };
}

function renderSheet(props: Partial<React.ComponentProps<typeof CareEditSheet>> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    careItem: makeCareItem(),
  };
  return render(<CareEditSheet {...defaults} {...props} />);
}

// ============================================================
// 테스트
// ============================================================
describe('CareEditSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 렌더링 조건 ────────────────────────────────────────────
  describe('렌더링 조건', () => {
    it('careItem이 null이면 Sheet 콘텐츠를 렌더링하지 않는다', () => {
      renderSheet({ careItem: null, open: false });
      expect(screen.queryByText('케어 항목 수정')).not.toBeInTheDocument();
    });

    it('open이 true이고 careItem이 있으면 Sheet 제목을 렌더링한다', () => {
      renderSheet();
      expect(screen.getByText('케어 항목 수정')).toBeInTheDocument();
    });
  });

  // ─── 폼 초기값 ──────────────────────────────────────────────
  describe('폼 초기값', () => {
    it('careItem의 name이 이름 입력 필드에 채워진다', () => {
      renderSheet({ careItem: makeCareItem({ name: '귀 청소' }) });
      expect(screen.getByPlaceholderText('예: 목욕')).toHaveValue('귀 청소');
    });

    it('careItem의 cycleValue가 주기 숫자 입력 필드에 채워진다', () => {
      renderSheet({ careItem: makeCareItem({ cycleValue: 14 }) });
      const input = screen.getByDisplayValue('14');
      expect(input).toBeInTheDocument();
    });

    it('careItem의 icon이 선택된 상태로 표시된다', () => {
      renderSheet({ careItem: makeCareItem({ icon: '💊' }) });
      // 선택된 아이콘 버튼은 ring-indigo-600 클래스를 가짐
      const selectedIconBtn = screen
        .getAllByRole('button')
        .find(
          (btn) =>
            btn.textContent === '💊' && btn.className.includes('ring-indigo-600'),
        );
      expect(selectedIconBtn).toBeDefined();
    });
  });

  // ─── 저장 버튼 ──────────────────────────────────────────────
  describe('저장 버튼', () => {
    it('클릭 시 useUpdateCareItem의 mutate를 호출한다', async () => {
      renderSheet();

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateCareItem).toHaveBeenCalledTimes(1);
    });

    it('mutate를 careItem id와 현재 폼 값으로 호출한다', async () => {
      renderSheet({ careItem: makeCareItem({ name: '목욕', cycleValue: 7 }) });

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateCareItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'care-item-1',
          name: '목욕',
          cycleValue: 7,
        }),
        expect.any(Object),
      );
    });

    it('이름이 비어있으면 저장 버튼이 비활성화된다', async () => {
      renderSheet({ careItem: makeCareItem({ name: '목욕' }) });

      const nameInput = screen.getByPlaceholderText('예: 목욕');
      await userEvent.clear(nameInput);

      expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });
  });

  // ─── 삭제 버튼 ──────────────────────────────────────────────
  describe('삭제 버튼', () => {
    it('클릭 시 ConfirmDialog가 표시된다', async () => {
      renderSheet();

      await userEvent.click(screen.getByRole('button', { name: '삭제' }));

      // ConfirmDialog title 확인
      expect(screen.getByText('케어 항목 삭제')).toBeInTheDocument();
    });

    it('ConfirmDialog의 확인 버튼 클릭 시 useDeleteCareItem의 mutate를 호출한다', async () => {
      renderSheet();

      // 삭제 버튼 클릭 → ConfirmDialog 열기
      await userEvent.click(screen.getByRole('button', { name: '삭제' }));

      // ConfirmDialog는 role="dialog", name="케어 항목 삭제"로 식별
      const confirmDialog = screen.getByRole('dialog', { name: '케어 항목 삭제' });
      await userEvent.click(within(confirmDialog).getByRole('button', { name: '삭제' }));

      expect(mockDeleteCareItem).toHaveBeenCalledWith(
        'care-item-1',
        expect.any(Object),
      );
    });

    it('ConfirmDialog의 취소 버튼 클릭 시 dialog가 닫힌다', async () => {
      renderSheet();

      await userEvent.click(screen.getByRole('button', { name: '삭제' }));
      expect(screen.getByText('케어 항목 삭제')).toBeInTheDocument();

      const confirmDialog = screen.getByRole('dialog', { name: '케어 항목 삭제' });
      await userEvent.click(within(confirmDialog).getByRole('button', { name: '취소' }));

      expect(screen.queryByText('케어 항목 삭제')).not.toBeInTheDocument();
    });
  });
});
