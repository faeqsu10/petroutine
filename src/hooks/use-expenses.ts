'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, addDoc, limit, doc, updateDoc, deleteDoc, documentId } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { endOfMonth, format } from 'date-fns';
import { chunkArray } from '@/lib/utils';
import type { Expense, MonthlyStats } from '@/types';

const EXPENSES_KEY = 'expenses';
const STATS_KEY = 'expense-stats';

export function useExpenses(petId: string | null, month?: string) {
  return useQuery({
    queryKey: [EXPENSES_KEY, petId, month],
    queryFn: async (): Promise<Expense[]> => {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];

      // Firestore requires: equality filters → inequality filters → orderBy on the inequality field
      const constraints: Parameters<typeof query>[1][] = [
        where('userId', '==', uid),
      ];

      if (petId) constraints.push(where('petId', '==', petId));

      if (month) {
        const start = `${month}-01`;
        const end = format(endOfMonth(new Date(`${month}-01`)), 'yyyy-MM-dd');
        constraints.push(where('expenseDate', '>=', start));
        constraints.push(where('expenseDate', '<=', end));
      }

      constraints.push(orderBy('expenseDate', 'desc'));
      constraints.push(limit(50));

      const q = query(collection(db, 'expenses'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          petId: data.petId,
          categoryId: data.categoryId,
          amount: data.amount,
          description: data.description,
          expenseDate: data.expenseDate,
          memo: data.memo ?? null,
        } as Expense;
      });
    },
  });
}

export function useMonthlyStats(month: string) {
  return useQuery({
    queryKey: [STATS_KEY, month],
    queryFn: async (): Promise<MonthlyStats> => {
      const uid = auth.currentUser?.uid;
      if (!uid) return { month, totalAmount: 0, byCategory: [], byPet: [] };

      const start = `${month}-01`;
      const end = format(endOfMonth(new Date(`${month}-01`)), 'yyyy-MM-dd');

      const expensesSnap = await getDocs(
        query(
          collection(db, 'expenses'),
          where('userId', '==', uid),
          where('expenseDate', '>=', start),
          where('expenseDate', '<=', end),
        ),
      );

      const items = expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }));

      if (items.length === 0) {
        return { month, totalAmount: 0, byCategory: [], byPet: [] };
      }

      const categoryIds = [...new Set(items.map((i) => i.categoryId as string).filter(Boolean))];
      const petIds = [...new Set(items.map((i) => i.petId as string).filter(Boolean))];

      const catChunks = chunkArray(categoryIds.length > 0 ? categoryIds : ['__none__'], 30);
      const petChunks = chunkArray(petIds.length > 0 ? petIds : ['__none__'], 30);

      const [catsSnaps, petsSnaps] = await Promise.all([
        Promise.all(
          catChunks.map((chunk) =>
            getDocs(
              query(
                collection(db, 'expenseCategories'),
                where(documentId(), 'in', chunk),
              ),
            ),
          ),
        ),
        Promise.all(
          petChunks.map((chunk) =>
            getDocs(
              query(
                collection(db, 'pets'),
                where(documentId(), 'in', chunk),
              ),
            ),
          ),
        ),
      ]);

      const catsSnap = { docs: catsSnaps.flatMap((s) => s.docs) };
      const petsSnap = { docs: petsSnaps.flatMap((s) => s.docs) };

      const catMap = new Map(
        catsSnap.docs.map((d) => [d.id, d.data() as { name: string; icon: string; color: string }]),
      );
      const petMap = new Map(
        petsSnap.docs.map((d) => [d.id, d.data() as { name: string }]),
      );

      const totalAmount = items.reduce((sum, e) => sum + (e.amount as number), 0);

      const byCategoryMap = new Map<string, { name: string; amount: number; icon: string; color: string }>();
      const byPetMap = new Map<string, { name: string; amount: number }>();

      for (const item of items) {
        const catId = item.categoryId as string;
        const petId = item.petId as string;
        const amount = item.amount as number;

        const cat = byCategoryMap.get(catId) ?? {
          name: catMap.get(catId)?.name ?? '',
          amount: 0,
          icon: catMap.get(catId)?.icon ?? '',
          color: catMap.get(catId)?.color ?? '',
        };
        cat.amount += amount;
        byCategoryMap.set(catId, cat);

        const pet = byPetMap.get(petId) ?? {
          name: petMap.get(petId)?.name ?? '',
          amount: 0,
        };
        pet.amount += amount;
        byPetMap.set(petId, pet);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'expenses'), {
        userId: uid,
        petId: expense.petId,
        categoryId: expense.categoryId,
        amount: expense.amount,
        description: expense.description,
        expenseDate: expense.expenseDate,
        receiptUrl: null,
        memo: expense.memo ?? null,
        createdAt: now,
        updatedAt: now,
      });

      return { id: docRef.id, ...expense };
    },
    onSuccess: (_data, expense) => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_KEY, expense.petId] });
      queryClient.invalidateQueries({ queryKey: [EXPENSES_KEY, null] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Expense> & { id: string }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      await updateDoc(doc(db, 'expenses', id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      // Hard delete: 지출은 복구 필요 없음
      await deleteDoc(doc(db, 'expenses', expenseId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}
