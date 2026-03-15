'use client';

import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useExpenses, useMonthlyStats } from '@/hooks/use-expenses';
import { usePets } from '@/hooks/use-pets';
import { formatCurrency } from '@/lib/utils';
import { BOTTOM_NAV_PADDING } from '@/lib/constants';
import { ExpenseEditSheet } from '@/components/expenses/edit-sheet';
import type { Expense } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExpensesPage() {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const currentMonth = format(currentMonthDate, 'yyyy-MM');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterPetId, setFilterPetId] = useState<string | null>(null);

  const { data: pets } = usePets();
  const handlePrevMonth = () => setCurrentMonthDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentMonthDate((d) => addMonths(d, 1));
  const { data: stats, isError: statsError } = useMonthlyStats(currentMonth);
  const { data: expenses, isError: expensesError } = useExpenses(filterPetId, currentMonth);

  if (statsError || expensesError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-5">
        <p className="text-sm font-medium text-destructive">데이터를 불러오지 못했어요</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-bold text-primary"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground/90">가계부</h1>
        <p className="text-sm text-muted-foreground">우리 아이를 위한 지출을 관리하세요</p>
      </header>

      {/* 반려동물 필터 탭 */}
      {pets && pets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterPetId(null)}
            className={`shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
              filterPetId === null
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
            }`}
          >
            전체
          </button>
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setFilterPetId(pet.id)}
              className={`shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                filterPetId === pet.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
              }`}
            >
              {pet.name}
            </button>
          ))}
        </div>
      )}

      {/* 월별 총지출 카드 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#FF9A8B] p-8 text-white shadow-xl shadow-primary/20"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-black/5 blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-10 w-10 rounded-full text-white hover:bg-white/20 active:scale-90"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <p className="text-sm font-bold tracking-tight opacity-90">
              {format(currentMonthDate, 'yyyy년 M월', { locale: ko })}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-10 w-10 rounded-full text-white hover:bg-white/20 active:scale-90"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
          <div className="mt-6 flex flex-col items-center gap-1">
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">총 지출 금액</span>
            <p className="text-4xl font-black tracking-tighter">{formatCurrency(stats?.totalAmount ?? 0)}</p>
          </div>
        </div>
      </motion.div>

      {/* 카테고리별 지출 */}
      <AnimatePresence mode="wait">
        {stats?.byCategory && stats.byCategory.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              카테고리별 지출
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.byCategory.map((cat) => {
                const percent = stats.totalAmount > 0
                  ? Math.round((cat.amount / stats.totalAmount) * 100)
                  : 0;
                return (
                  <div
                    key={cat.categoryId}
                    className="bento-item flex flex-col gap-2 bg-card/40 glass p-4"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground">{cat.name}</span>
                      <span className="text-sm font-black text-foreground/80">
                        {formatCurrency(cat.amount)} ({percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 최근 내역 */}
      <section className="space-y-4">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          최근 지출 내역
        </h2>
        {expenses?.length === 0 ? (
          <div className="bento-item flex flex-col items-center gap-2 bg-card/40 glass py-12 text-center">
            <p className="text-3xl opacity-20">💸</p>
            <p className="text-sm font-medium text-muted-foreground">아직 기록된 지출이 없어요</p>
          </div>
        ) : (
          <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/40 glass">
            {expenses?.map((expense) => (
              <button
                key={expense.id}
                type="button"
                onClick={() => setEditingExpense(expense)}
                className="flex w-full items-center justify-between p-4.5 text-left transition-all hover:bg-primary/5 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">
                    {stats?.byCategory.find((c) => c.categoryId === expense.categoryId)?.icon || '💰'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground/80">{expense.description || '지출'}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{expense.expenseDate}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-foreground/90">
                  {formatCurrency(expense.amount)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 플로팅 추가 버튼 */}
      <Link href="/expenses/add">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-28 right-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 active:bg-primary/90"
        >
          <Plus className="h-8 w-8" />
        </motion.button>
      </Link>

      {/* 지출 수정 시트 */}
      <ExpenseEditSheet
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        expense={editingExpense}
      />
    </div>
  );
}
