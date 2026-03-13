import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OfflineAction {
  id: string;
  type: 'complete' | 'skip' | 'postpone';
  careItemId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface CareStoreState {
  selectedPetId: string | null;
  offlineQueue: OfflineAction[];
  setSelectedPetId: (petId: string | null) => void;
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'createdAt'>) => void;
  clearOfflineQueue: () => void;
  removeOfflineAction: (id: string) => void;
}

export const useCareStore = create<CareStoreState>()(
  persist(
    (set) => ({
      selectedPetId: null,
      offlineQueue: [],
      setSelectedPetId: (petId) => set({ selectedPetId: petId }),
      addOfflineAction: (action) =>
        set((state) => ({
          offlineQueue: [
            ...state.offlineQueue,
            {
              ...action,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      clearOfflineQueue: () => set({ offlineQueue: [] }),
      removeOfflineAction: (id) =>
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((a) => a.id !== id),
        })),
    }),
    { name: 'petroutine-care-store' },
  ),
);
