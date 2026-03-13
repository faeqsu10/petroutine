'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useUpdateCareItem, useDeleteCareItem } from '@/hooks/use-care-items';
import { cn } from '@/lib/utils';
import type { CareItem } from '@/types';

const PRESET_COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];
const PRESET_ICONS = ['🛁', '💊', '💉', '✂️', '🦷', '🐾', '🍖', '🏥', '🧴', '👁️', '🦴', '🚿'];
const CYCLE_UNIT_LABELS: Record<string, string> = { day: '일', week: '주', month: '개월' };

interface CareEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careItem: CareItem | null;
}

export function CareEditSheet({ open, onOpenChange, careItem }: CareEditSheetProps) {
  const [name, setName] = useState('');
  const [cycleValue, setCycleValue] = useState(1);
  const [cycleUnit, setCycleUnit] = useState<'day' | 'week' | 'month'>('week');
  const [icon, setIcon] = useState('🐾');
  const [color, setColor] = useState('#6366F1');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { mutate: updateCareItem, isPending: isUpdating } = useUpdateCareItem();
  const { mutate: deleteCareItem, isPending: isDeleting } = useDeleteCareItem();

  useEffect(() => {
    if (careItem) {
      setName(careItem.name);
      setCycleValue(careItem.cycleValue);
      setCycleUnit(careItem.cycleUnit);
      setIcon(careItem.icon);
      setColor(careItem.color);
    }
  }, [careItem]);

  function handleSave() {
    if (!careItem || !name.trim()) return;
    updateCareItem(
      { id: careItem.id, name: name.trim(), cycleValue, cycleUnit, icon, color },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  function handleDelete() {
    if (!careItem) return;
    deleteCareItem(careItem.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onOpenChange(false);
      },
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-6">
          <SheetHeader className="px-0">
            <SheetTitle className="text-lg font-bold text-gray-800">케어 항목 수정</SheetTitle>
            <SheetDescription className="sr-only">케어 항목의 이름, 주기, 아이콘, 색상을 수정합니다</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-5">
            {/* 이름 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">항목 이름</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                placeholder="예: 목욕"
              />
            </div>

            {/* 주기 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">주기</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={cycleValue}
                  onChange={(e) => setCycleValue(e.target.valueAsNumber || 1)}
                  className="flex-1 rounded-xl"
                />
                <Select value={cycleUnit} onValueChange={(v) => setCycleUnit(v as 'day' | 'week' | 'month')}>
                  <SelectTrigger className="flex-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CYCLE_UNIT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 아이콘 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">아이콘</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all',
                      icon === emoji ? 'bg-primary/10 ring-2 ring-primary' : 'bg-secondary',
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 색상 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">색상</Label>
              <div className="flex gap-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-8 w-8 rounded-full transition-all',
                      color === c && 'ring-2 ring-offset-2',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                삭제
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating || !name.trim()}
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUpdating ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="케어 항목 삭제"
        description="이 케어 항목을 삭제하시겠습니까? 관련 기록은 유지됩니다."
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
}
