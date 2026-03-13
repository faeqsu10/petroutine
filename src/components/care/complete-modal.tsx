'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompleteCare } from '@/hooks/use-care-items';
import type { CareItem } from '@/types';

interface CompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careItem: CareItem | null;
}

export function CompleteModal({ open, onOpenChange, careItem }: CompleteModalProps) {
  const [memo, setMemo] = useState('');
  const { mutate: completeCare, isPending } = useCompleteCare();

  function handleComplete() {
    if (!careItem || !careItem.schedule) return;
    completeCare(
      {
        careItemId: careItem.id,
        scheduleId: careItem.schedule.id,
        cycleValue: careItem.cycleValue,
        cycleUnit: careItem.cycleUnit,
        memo: memo.trim() || undefined,
      },
      {
        onSuccess: () => {
          setMemo('');
          onOpenChange(false);
        },
      },
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setMemo('');
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            {careItem && (
              <span className="text-2xl">{careItem.icon}</span>
            )}
            {careItem?.name ?? ''}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="memo" className="text-sm font-medium text-gray-700">
            메모 (선택)
          </Label>
          <Textarea
            id="memo"
            placeholder="케어 관련 메모를 남겨보세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="resize-none rounded-xl"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleComplete}
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 active:scale-95"
          >
            {isPending ? '처리 중...' : '완료하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
