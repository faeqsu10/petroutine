'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ExpenseCategory } from '@/types';
import type { ExpenseCategoriesRow } from '@/types/database';

const EXPENSE_CATEGORIES_KEY = 'expense-categories';

export function useExpenseCategories() {
  const supabase = createClient();

  return useQuery({
    queryKey: [EXPENSE_CATEGORIES_KEY],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return ((data ?? []) as ExpenseCategoriesRow[]).map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      }));
    },
  });
}
