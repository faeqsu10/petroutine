import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ============================================================
// 훅 모킹 — vi.mock은 호이스팅됨
// ============================================================
const mockCompleteCare = vi.fn();

vi.mock('@/hooks/use-care-items', () => ({
  useCompleteCare: () => ({
    mutate: mockCompleteCare,
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
import { CompleteModal } from '@/components/care/complete-modal';
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
    schedule: {
      id: 'schedule-1',
      careItemId: 'care-item-1',
      nextDueDate: '2026-03-14',
      status: 'due',
    },
    lastLog: null,
    ...overrides,
  };
}

function renderModal(props: Partial<React.ComponentProps<typeof CompleteModal>> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    careItem: makeCareItem(),
  };
  return render(<CompleteModal {...defaults} {...props} />);
}

// ============================================================
// 테스트
// ============================================================
describe('CompleteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 렌더링 조건 ────────────────────────────────────────────
  describe('렌더링 조건', () => {
    it('open이 false이면 렌더링하지 않는다', () => {
      renderModal({ open: false });
      expect(screen.queryByText('목욕')).not.toBeInTheDocument();
    });

    it('open이 true이면 모달이 표시된다', () => {
      renderModal({ open: true });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('케어 항목 이름이 표시된다', () => {
      renderModal({ careItem: makeCareItem({ name: '귀 청소' }) });
      expect(screen.getByText('귀 청소')).toBeInTheDocument();
    });

    it('메모 입력 필드가 있다', () => {
      renderModal();
      expect(
        screen.getByPlaceholderText('케어 관련 메모를 남겨보세요'),
      ).toBeInTheDocument();
    });

    it('careItem이 null이면 아무것도 렌더링하지 않는다', () => {
      renderModal({ careItem: null, open: false });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ─── 완료 버튼 ──────────────────────────────────────────────
  describe('완료 버튼', () => {
    it('완료 버튼 클릭 시 useCompleteCare mutate를 호출한다', async () => {
      renderModal();

      await userEvent.click(screen.getByRole('button', { name: '완료하기' }));

      expect(mockCompleteCare).toHaveBeenCalledTimes(1);
      expect(mockCompleteCare).toHaveBeenCalledWith(
        expect.objectContaining({
          careItemId: 'care-item-1',
          scheduleId: 'schedule-1',
          cycleValue: 7,
          cycleUnit: 'day',
        }),
        expect.any(Object),
      );
    });

    it('완료 성공 시 onOpenChange(false)를 호출한다', async () => {
      const onOpenChange = vi.fn();
      mockCompleteCare.mockImplementationOnce((_vars: unknown, opts: { onSuccess: () => void }) => {
        opts.onSuccess();
      });

      renderModal({ onOpenChange });

      await userEvent.click(screen.getByRole('button', { name: '완료하기' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
