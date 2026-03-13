'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CareItem } from '@/types';
import type { CareItemsRow, CareSchedulesRow, CareLogsRow } from '@/types/database';

const CARE_ITEMS_KEY = 'care-items';

export function useCareItems(petId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: [CARE_ITEMS_KEY, petId],
    queryFn: async (): Promise<CareItem[]> => {
      if (!petId) return [];

      const { data, error } = await supabase
        .from('care_items')
        .select('*')
        .eq('pet_id', petId)
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) throw error;

      const items = (data ?? []) as CareItemsRow[];
      const itemIds = items.map((i) => i.id);
      if (itemIds.length === 0) return [];

      const [schedulesRes, logsRes] = await Promise.all([
        supabase
          .from('care_schedules')
          .select('*')
          .in('care_item_id', itemIds)
          .in('status', ['pending', 'due', 'overdue']),
        supabase
          .from('care_logs')
          .select('*')
          .in('care_item_id', itemIds)
          .order('completed_at', { ascending: false }),
      ]);

      const schedules = (schedulesRes.data ?? []) as CareSchedulesRow[];
      const logs = (logsRes.data ?? []) as CareLogsRow[];

      const scheduleMap = new Map(schedules.map((s) => [s.care_item_id, s]));
      const logMap = new Map<string, CareLogsRow>();
      for (const log of logs) {
        if (!logMap.has(log.care_item_id)) logMap.set(log.care_item_id, log);
      }

      return items.map((item) => {
        const schedule = scheduleMap.get(item.id);
        const lastLog = logMap.get(item.id);
        return {
          id: item.id,
          petId: item.pet_id,
          category: item.category,
          name: item.name,
          cycleValue: item.cycle_value,
          cycleUnit: item.cycle_unit,
          icon: item.icon,
          color: item.color,
          isActive: item.is_active,
          notifyEnabled: item.notify_enabled,
          schedule: schedule ? {
            id: schedule.id,
            careItemId: item.id,
            nextDueDate: schedule.next_due_date,
            status: schedule.status,
          } : null,
          lastLog: lastLog ? {
            id: lastLog.id,
            careItemId: item.id,
            completedAt: lastLog.completed_at,
            scheduledDate: lastLog.scheduled_date,
            memo: lastLog.memo,
          } : null,
        };
      });
    },
    enabled: !!petId,
  });
}

export function useCompleteCare() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ careItemId, memo }: { careItemId: string; memo?: string }) => {
      const { data, error } = await supabase.functions.invoke('complete-care', {
        body: { care_item_id: careItemId, memo },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_KEY] });
    },
  });
}
