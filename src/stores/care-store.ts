import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CareStoreState {
  selectedPetId: string | null;
  setSelectedPetId: (petId: string | null) => void;
}

export const useCareStore = create<CareStoreState>()(
  persist(
    (set) => ({
      selectedPetId: null,
      setSelectedPetId: (petId) => set({ selectedPetId: petId }),
    }),
    { name: 'petroutine-care-store' },
  ),
);
