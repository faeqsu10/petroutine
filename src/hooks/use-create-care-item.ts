'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCareItemInput) => {
      const { data, error } = await supabase
        .from('care_items')
        .insert({
          pet_id: input.petId,
          category: input.category,
          name: input.name,
          cycle_value: input.cycleValue,
          cycle_unit: input.cycleUnit,
          icon: input.icon,
          color: input.color,
          is_active: true,
          notify_enabled: input.notifyEnabled,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_ITEMS_KEY] });
    },
  });
}
