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
import { toast } from 'sonner';
import { useCompleteCare, useUndoCompleteCare } from '@/hooks/use-care-items';
import type { CareItem } from '@/types';

interface CompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careItem: CareItem | null;
}

function todayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CompleteModal({ open, onOpenChange, careItem }: CompleteModalProps) {
  const [memo, setMemo] = useState('');
  const [completedDate, setCompletedDate] = useState(todayDateStr);
  const { mutate: completeCare, isPending } = useCompleteCare();
  const { mutate: undoComplete } = useUndoCompleteCare();

  function handleComplete() {
    if (!careItem || !careItem.schedule) return;
    const previousScheduleId = careItem.schedule.id;
    completeCare(
      {
        careItemId: careItem.id,
        scheduleId: previousScheduleId,
        cycleValue: careItem.cycleValue,
        cycleUnit: careItem.cycleUnit,
        memo: memo.trim() || undefined,
        completedAt: completedDate,
      },
      {
        onSuccess: (data) => {
          setMemo('');
          setCompletedDate(todayDateStr());
          onOpenChange(false);
          toast.success('완료! 다음 예정일이 자동으로 설정됐어요', {
            action: {
              label: '되돌리기',
              onClick: () => {
                undoComplete({
                  logId: data.logId,
                  newScheduleId: data.newScheduleId,
                  previousScheduleId,
                });
              },
            },
            duration: 5000,
          });
        },
        onError: () => {
          toast.error('완료 처리에 실패했어요. 다시 시도해주세요.');
        },
      },
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setMemo('');
      setCompletedDate(todayDateStr());
    }
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

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="completedDate" className="text-sm font-medium text-gray-700">
              완료 날짜
            </Label>
            <input
              id="completedDate"
              type="date"
              value={completedDate}
              max={todayDateStr()}
              onChange={(e) => setCompletedDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleComplete}
            disabled={isPending}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95"
          >
            {isPending ? '처리 중...' : '완료하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
