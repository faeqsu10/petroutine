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
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useUpdateExpense, useDeleteExpense } from '@/hooks/use-expenses';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { cn } from '@/lib/utils';
import type { Expense } from '@/types';

interface ExpenseEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function ExpenseEditSheet({ open, onOpenChange, expense }: ExpenseEditSheetProps) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [memo, setMemo] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: categories = [] } = useExpenseCategories();
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense();
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount);
      setDescription(expense.description);
      setCategoryId(expense.categoryId);
      setExpenseDate(expense.expenseDate);
      setMemo(expense.memo ?? '');
    }
  }, [expense]);

  function handleSave() {
    if (!expense || amount <= 0 || !description.trim()) return;
    updateExpense(
      {
        id: expense.id,
        amount,
        description: description.trim(),
        categoryId,
        expenseDate,
        memo: memo.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  function handleDelete() {
    if (!expense) return;
    deleteExpense(expense.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onOpenChange(false);
      },
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-6">
          <SheetHeader className="px-0">
            <SheetTitle className="text-lg font-bold text-gray-800">지출 수정</SheetTitle>
            <SheetDescription className="sr-only">지출 내역의 금액, 내용, 카테고리, 날짜를 수정합니다</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-5">
            {/* 금액 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">금액</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={amount || ''}
                  onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
                  className="rounded-xl text-right text-xl font-bold"
                />
                <span className="text-lg font-semibold text-gray-500">원</span>
              </div>
            </div>

            {/* 내용 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">내용</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl"
                placeholder="예: 정기 예방접종"
              />
            </div>

            {/* 카테고리 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">카테고리</Label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-2.5 transition-all',
                      categoryId === cat.id
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100',
                    )}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className={cn('text-xs font-medium', categoryId === cat.id ? 'text-indigo-600' : 'text-gray-600')}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 날짜 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">날짜</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* 메모 */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-gray-700">
                메모 <span className="text-gray-400">(선택)</span>
              </Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                className="resize-none rounded-xl"
                placeholder="추가 메모"
              />
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
                disabled={isUpdating || amount <= 0 || !description.trim()}
                className="flex-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
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
        title="지출 삭제"
        description="이 지출 내역을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
}
