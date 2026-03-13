'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useExpenses, useMonthlyStats } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';

export default function ExpensesPage() {
  const [currentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const { data: stats } = useMonthlyStats(currentMonth);
  const { data: expenses } = useExpenses(null, currentMonth);

  return (
    <div className="space-y-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold text-gray-800">가계부</h1>

      {/* 월별 총지출 */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-lg">
        <p className="text-sm opacity-80">{currentMonth.replace('-', '년 ')}월</p>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(stats?.totalAmount ?? 0)}</p>
      </div>

      {/* 카테고리별 지출 */}
      {stats?.byCategory && stats.byCategory.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-500">카테고리별</h2>
          <div className="space-y-2">
            {stats.byCategory.map((cat) => (
              <div
                key={cat.categoryId}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 최근 내역 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-500">최근 내역</h2>
        {expenses?.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">아직 지출 내역이 없어요</p>
        ) : (
          <div className="space-y-2">
            {expenses?.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{expense.description || '지출'}</p>
                  <p className="text-xs text-gray-400">{expense.expenseDate}</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
