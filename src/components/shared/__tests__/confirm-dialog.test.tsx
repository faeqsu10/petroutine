import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

// ============================================================
// cn 유틸 — 실제 구현 사용 (클래스명 병합)
// ============================================================

function makeProps(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    title: '테스트 제목',
    description: '테스트 설명',
    onConfirm: vi.fn(),
    ...overrides,
  };
}

describe('ConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 렌더링 ────────────────────────────────────────────────
  describe('열림/닫힘 상태', () => {
    it('open이 true이면 Dialog 콘텐츠를 렌더링한다', () => {
      render(<ConfirmDialog {...makeProps({ open: true })} />);
      expect(screen.getByText('테스트 제목')).toBeInTheDocument();
      expect(screen.getByText('테스트 설명')).toBeInTheDocument();
    });

    it('open이 false이면 Dialog 콘텐츠를 렌더링하지 않는다', () => {
      render(<ConfirmDialog {...makeProps({ open: false })} />);
      expect(screen.queryByText('테스트 제목')).not.toBeInTheDocument();
    });
  });

  // ─── 확인 버튼 ─────────────────────────────────────────────
  describe('확인 버튼', () => {
    it('클릭 시 onConfirm 콜백을 호출한다', async () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog {...makeProps({ onConfirm })} />);

      await userEvent.click(screen.getByRole('button', { name: '삭제' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('isPending이 true이면 비활성화된다', () => {
      render(<ConfirmDialog {...makeProps({ isPending: true })} />);

      const confirmBtn = screen.getByRole('button', { name: '처리 중...' });
      expect(confirmBtn).toBeDisabled();
    });

    it('isPending이 true이면 "처리 중..." 텍스트를 표시한다', () => {
      render(<ConfirmDialog {...makeProps({ isPending: true })} />);
      expect(screen.getByRole('button', { name: '처리 중...' })).toBeInTheDocument();
    });

    it('isPending이 false이면 confirmLabel 텍스트를 표시한다', () => {
      render(<ConfirmDialog {...makeProps({ isPending: false, confirmLabel: '삭제' })} />);
      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    });

    it('isPending이 false이면 활성화된다', () => {
      render(<ConfirmDialog {...makeProps({ isPending: false })} />);
      const confirmBtn = screen.getByRole('button', { name: '삭제' });
      expect(confirmBtn).not.toBeDisabled();
    });
  });

  // ─── 취소 버튼 ─────────────────────────────────────────────
  describe('취소 버튼', () => {
    it('클릭 시 onOpenChange(false)를 호출한다', async () => {
      const onOpenChange = vi.fn();
      render(<ConfirmDialog {...makeProps({ onOpenChange })} />);

      await userEvent.click(screen.getByRole('button', { name: '취소' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('isPending이 true이면 취소 버튼도 비활성화된다', () => {
      render(<ConfirmDialog {...makeProps({ isPending: true })} />);
      expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    });
  });

  // ─── 커스텀 props ──────────────────────────────────────────
  describe('커스텀 title / description / confirmLabel', () => {
    it('커스텀 title을 렌더링한다', () => {
      render(<ConfirmDialog {...makeProps({ title: '케어 항목 삭제' })} />);
      expect(screen.getByText('케어 항목 삭제')).toBeInTheDocument();
    });

    it('커스텀 description을 렌더링한다', () => {
      render(
        <ConfirmDialog
          {...makeProps({ description: '이 항목을 삭제하시겠습니까?' })}
        />,
      );
      expect(screen.getByText('이 항목을 삭제하시겠습니까?')).toBeInTheDocument();
    });

    it('confirmLabel이 제공되면 해당 텍스트를 버튼에 표시한다', () => {
      render(<ConfirmDialog {...makeProps({ confirmLabel: '확인' })} />);
      expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    });

    it('confirmLabel이 없으면 기본값 "삭제"를 표시한다', () => {
      const props = makeProps();
      // confirmLabel을 명시적으로 제거
      const { confirmLabel: _omit, ...propsWithoutLabel } = props;
      render(<ConfirmDialog {...propsWithoutLabel} />);
      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    });
  });
});
