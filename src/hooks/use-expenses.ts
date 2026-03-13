'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { endOfMonth, format } from 'date-fns';
import type { Expense, MonthlyStats } from '@/types';
import type { ExpensesRow } from '@/types/database';

const EXPENSES_KEY = 'expenses';
const STATS_KEY = 'expense-stats';

export function useExpenses(petId: string | null, month?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: [EXPENSES_KEY, petId, month],
    queryFn: async (): Promise<Expense[]> => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(50);

      if (petId) query = query.eq('pet_id', petId);
      if (month) {
        const start = `${month}-01`;
        const end = format(endOfMonth(new Date(`${month}-01`)), 'yyyy-MM-dd');
        query = query.gte('expense_date', start).lte('expense_date', end);
      }

      const { data, error } = await query;
      if (error) throw error;

      return ((data ?? []) as ExpensesRow[]).map((e) => ({
        id: e.id,
        petId: e.pet_id,
        categoryId: e.category_id,
        amount: e.amount,
        description: e.description,
        expenseDate: e.expense_date,
        memo: e.memo,
      }));
    },
  });
}

export function useMonthlyStats(month: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: [STATS_KEY, month],
    queryFn: async (): Promise<MonthlyStats> => {
      const start = `${month}-01`;
      const end = `${month}-31`;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', start)
        .lte('expense_date', end);

      if (error) throw error;

      const items = (data ?? []) as ExpensesRow[];

      // 별도로 카테고리 조회
      const categoryIds = [...new Set(items.map((i) => i.category_id))];
      const { data: categories } = await supabase
        .from('expense_categories')
        .select('*')
        .in('id', categoryIds.length > 0 ? categoryIds : ['__none__']);

      const catMap = new Map(
        ((categories ?? []) as { id: string; name: string; icon: string; color: string }[])
          .map((c) => [c.id, c]),
      );

      const petIds = [...new Set(items.map((i) => i.pet_id))];
      const { data: pets } = await supabase
        .from('pets')
        .select('id, name')
        .in('id', petIds.length > 0 ? petIds : ['__none__']);

      const petMap = new Map(
        ((pets ?? []) as { id: string; name: string }[]).map((p) => [p.id, p]),
      );

      const totalAmount = items.reduce((sum, e) => sum + e.amount, 0);

      const byCategoryMap = new Map<string, { name: string; amount: number; icon: string; color: string }>();
      const byPetMap = new Map<string, { name: string; amount: number }>();

      for (const item of items) {
        const cat = byCategoryMap.get(item.category_id) ?? {
          name: catMap.get(item.category_id)?.name ?? '',
          amount: 0,
          icon: catMap.get(item.category_id)?.icon ?? '',
          color: catMap.get(item.category_id)?.color ?? '',
        };
        cat.amount += item.amount;
        byCategoryMap.set(item.category_id, cat);

        const pet = byPetMap.get(item.pet_id) ?? {
          name: petMap.get(item.pet_id)?.name ?? '',
          amount: 0,
        };
        pet.amount += item.amount;
        byPetMap.set(item.pet_id, pet);
      }

      return {
        month,
        totalAmount,
        byCategory: Array.from(byCategoryMap.entries()).map(([id, v]) => ({ categoryId: id, ...v })),
        byPet: Array.from(byPetMap.entries()).map(([id, v]) => ({ petId: id, ...v })),
      };
    },
  });
}

export function useCreateExpense() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          pet_id: expense.petId,
          category_id: expense.categoryId,
          amount: expense.amount,
          description: expense.description,
          expense_date: expense.expenseDate,
          memo: expense.memo,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}
