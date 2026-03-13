'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { calculateNextDueDate, toLocalDateStr } from '@/lib/utils';
import type { CareItem } from '@/types';

const CARE_ITEMS_KEY = 'care-items';

export function useCareItems(petId: string | null) {
  return useQuery({
    queryKey: [CARE_ITEMS_KEY, petId],
    queryFn: async (): Promise<CareItem[]> => {
      if (!petId) return [];

      const uid = auth.currentUser?.uid;
      if (!uid) return [];

      const itemsSnap = await getDocs(
        query(
          collection(db, 'careItems'),
          where('petId', '==', petId),
          where('isActive', '==', true),
        ),
      );

      const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (items.length === 0) return [];

      const itemIds = items.map((i) => i.id);

      const [schedulesSnap, logsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'careSchedules'),
            where('careItemId', 'in', itemIds),
            where('status', 'in', ['pending', 'due', 'overdue']),
          ),
        ),
        getDocs(
          query(
            collection(db, 'careLogs'),
            where('careItemId', 'in', itemIds),
            orderBy('completedAt', 'desc'),
          ),
        ),
      ]);

      const scheduleMap = new Map<string, { id: string; careItemId: string; nextDueDate: string; status: string }>();
      for (const d of schedulesSnap.docs) {
        const data = d.data();
        if (!scheduleMap.has(data.careItemId)) {
          scheduleMap.set(data.careItemId, { id: d.id, ...data } as { id: string; careItemId: string; nextDueDate: string; status: string });
        }
      }

      const logMap = new Map<string, { id: string; careItemId: string; completedAt: string; scheduledDate: string | null; memo: string | null }>();
      for (const d of logsSnap.docs) {
        const data = d.data();
        if (!logMap.has(data.careItemId)) {
          logMap.set(data.careItemId, { id: d.id, ...data } as { id: string; careItemId: string; completedAt: string; scheduledDate: string | null; memo: string | null });
        }
      }

      return items.map((item) => {
        const data = item as Record<string, unknown>;
        const schedule = scheduleMap.get(item.id);
        const lastLog = logMap.get(item.id);
        return {
          id: item.id,
          petId: data.petId as string,
          category: data.category as CareItem['category'],
          name: data.name as string,
          cycleValue: data.cycleValue as number,
          cycleUnit: data.cycleUnit as CareItem['cycleUnit'],
          icon: data.icon as string,
          color: data.color as string,
          isActive: data.isActive as boolean,
          notifyEnabled: data.notifyEnabled as boolean,
          schedule: schedule
            ? {
                id: schedule.id,
                careItemId: item.id,
                nextDueDate: schedule.nextDueDate,
                status: schedule.status as CareItem['schedule'] extends { status: infer S } ? S : never,
              }
            : null,
          lastLog: lastLog
            ? {
                id: lastLog.id,
                careItemId: item.id,
                completedAt: lastLog.completedAt,
                scheduledDate: lastLog.scheduledDate,
                memo: lastLog.memo,
              }
            : null,
        } as CareItem;
      });
    },
    enabled: !!petId,
  });
}

export function useUpdateCareItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      cycleValue?: number;
      cycleUnit?: 'day' | 'week' | 'month';
      icon?: string;
      color?: string;
      notifyEnabled?: boolean;
    }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      await updateDoc(doc(db, 'careItems', id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_KEY] });
    },
  });
}

export function useDeleteCareItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (careItemId: string) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);

      // 1) Soft delete: isActive = false
      batch.update(doc(db, 'careItems', careItemId), {
        isActive: false,
        updatedAt: nowIso,
      });

      // 2) 관련 pending/due/overdue 스케줄 취소
      const openSchedules = await getDocs(
        query(
          collection(db, 'careSchedules'),
          where('careItemId', '==', careItemId),
          where('status', 'in', ['pending', 'due', 'overdue']),
        ),
      );
      for (const scheduleDoc of openSchedules.docs) {
        batch.update(scheduleDoc.ref, {
          status: 'cancelled',
          updatedAt: nowIso,
        });
      }

      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_KEY] });
    },
  });
}

export function useCompleteCare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      careItemId,
      scheduleId,
      cycleValue,
      cycleUnit,
      memo,
    }: {
      careItemId: string;
      scheduleId: string;
      cycleValue: number;
      cycleUnit: 'day' | 'week' | 'month';
      memo?: string;
    }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      const now = new Date();
      const nowIso = now.toISOString();
      const batch = writeBatch(db);

      // 1) care log 생성
      const logRef = doc(collection(db, 'careLogs'));
      batch.set(logRef, {
        careItemId,
        userId: uid,
        completedAt: nowIso,
        scheduledDate: null,
        memo: memo ?? null,
        createdAt: nowIso,
      });

      // 2) 현재 스케줄 완료 처리
      batch.update(doc(db, 'careSchedules', scheduleId), {
        status: 'completed',
        updatedAt: nowIso,
      });

      // 3) 다음 스케줄 생성
      const nextDue = calculateNextDueDate(now, cycleValue, cycleUnit);
      const nextScheduleRef = doc(collection(db, 'careSchedules'));
      batch.set(nextScheduleRef, {
        careItemId,
        userId: uid,
        nextDueDate: toLocalDateStr(nextDue),
        status: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_KEY] });
    },
  });
}
