'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { calculateNextDueDate, toLocalDateStr } from '@/lib/utils';

const CARE_ITEMS_KEY = 'care-items';

interface CreateCareItemInput {
  petId: string;
  category: 'hygiene' | 'health' | 'daily' | 'custom';
  name: string;
  cycleValue: number;
  cycleUnit: 'day' | 'week' | 'month';
  icon: string;
  color: string;
  notifyEnabled: boolean;
}

export function useCreateCareItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCareItemInput) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      const now = new Date();
      const nowIso = now.toISOString();
      const batch = writeBatch(db);

      // 1) care item 생성
      const itemRef = doc(collection(db, 'careItems'));
      batch.set(itemRef, {
        petId: input.petId,
        userId: uid,
        category: input.category,
        name: input.name,
        cycleValue: input.cycleValue,
        cycleUnit: input.cycleUnit,
        icon: input.icon,
        color: input.color,
        isActive: true,
        notifyEnabled: input.notifyEnabled,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // 2) 초기 스케줄 생성
      const nextDue = calculateNextDueDate(now, input.cycleValue, input.cycleUnit);
      const scheduleRef = doc(collection(db, 'careSchedules'));
      batch.set(scheduleRef, {
        careItemId: itemRef.id,
        userId: uid,
        nextDueDate: toLocalDateStr(nextDue),
        status: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await batch.commit();
      return { id: itemRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_KEY] });
    },
  });
}
