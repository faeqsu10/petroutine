import { describe, it, expect, beforeEach } from 'vitest';
import { useCareStore } from '@/stores/care-store';

describe('useCareStore', () => {
  beforeEach(() => {
    useCareStore.setState({ selectedPetId: null });
  });

  describe('selectedPetId', () => {
    it('초기값은 null이다', () => {
      expect(useCareStore.getState().selectedPetId).toBeNull();
    });

    it('setSelectedPetId로 반려동물 ID를 설정할 수 있다', () => {
      useCareStore.getState().setSelectedPetId('pet-1');
      expect(useCareStore.getState().selectedPetId).toBe('pet-1');
    });

    it('setSelectedPetId(null)로 선택을 해제할 수 있다', () => {
      useCareStore.getState().setSelectedPetId('pet-1');
      useCareStore.getState().setSelectedPetId(null);
      expect(useCareStore.getState().selectedPetId).toBeNull();
    });

    it('다른 반려동물로 변경할 수 있다', () => {
      useCareStore.getState().setSelectedPetId('pet-1');
      useCareStore.getState().setSelectedPetId('pet-2');
      expect(useCareStore.getState().selectedPetId).toBe('pet-2');
    });
  });
});
