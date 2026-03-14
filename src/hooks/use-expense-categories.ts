'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import type { ExpenseCategory } from '@/types';

const EXPENSE_CATEGORIES_KEY = 'expense-categories';

export function useExpenseCategories() {
  return useQuery({
    queryKey: [EXPENSE_CATEGORIES_KEY],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      const uid = auth.currentUser?.uid;

      // Two queries: default categories + user-specific categories
      const [defaultsSnap, userSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'expenseCategories'),
            where('userId', '==', null),
            where('isDefault', '==', true),
            orderBy('sortOrder'),
          ),
        ),
        uid
          ? getDocs(
              query(
                collection(db, 'expenseCategories'),
                where('userId', '==', uid),
                where('isDefault', '==', false),
                orderBy('sortOrder'),
              ),
            )
          : Promise.resolve(null),
      ]);

      const toCategory = (d: { id: string; data: () => Record<string, unknown> }): ExpenseCategory => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name as string,
          icon: data.icon as string,
          color: data.color as string,
        };
      };

      const defaults = defaultsSnap.docs.map(toCategory);
      const userCats = userSnap ? userSnap.docs.map(toCategory) : [];

      // Merge: defaults first, then user-specific
      return [...defaults, ...userCats];
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; icon: string; color: string }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      await addDoc(collection(db, 'expenseCategories'), {
        ...input,
        userId: uid,
        isDefault: false,
        sortOrder: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}
