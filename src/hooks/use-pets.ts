'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Pet } from '@/types';
import type { PetsRow } from '@/types/database';

const PETS_KEY = 'pets';

export function usePets() {
  const supabase = createClient();

  return useQuery({
    queryKey: [PETS_KEY],
    queryFn: async (): Promise<Pet[]> => {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return ((data ?? []) as PetsRow[]).map((pet) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birth_date,
        gender: pet.gender,
        neutered: pet.neutered,
        weightKg: pet.weight_kg,
        avatarUrl: pet.avatar_url,
      }));
    },
  });
}

export function useCreatePet() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pet: Omit<Pet, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          birth_date: pet.birthDate,
          gender: pet.gender,
          neutered: pet.neutered,
          weight_kg: pet.weightKg,
          avatar_url: pet.avatarUrl,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PETS_KEY] });
    },
  });
}
