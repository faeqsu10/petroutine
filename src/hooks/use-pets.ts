'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import type { Pet } from '@/types';

const PETS_KEY = 'pets';

export function usePets() {
  return useQuery({
    queryKey: [PETS_KEY],
    queryFn: async (): Promise<Pet[]> => {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];

      const q = query(
        collection(db, 'pets'),
        where('userId', '==', uid),
        where('archivedAt', '==', null),
        orderBy('createdAt'),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          species: data.species,
          breed: data.breed,
          birthDate: data.birthDate,
          gender: data.gender,
          neutered: data.neutered,
          weightKg: data.weightKg,
          avatarUrl: data.avatarUrl,
        } as Pet;
      });
    },
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pet: Omit<Pet, 'id'>) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'pets'), {
        userId: uid,
        name: pet.name,
        species: pet.species,
        breed: pet.breed ?? null,
        birthDate: pet.birthDate ?? null,
        gender: pet.gender ?? null,
        neutered: pet.neutered,
        weightKg: pet.weightKg ?? null,
        avatarUrl: pet.avatarUrl ?? null,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      });

      return { id: docRef.id, ...pet };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PETS_KEY] });
    },
  });
}
