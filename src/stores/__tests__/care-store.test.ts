import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCareStore } from '@/stores/care-store';

// crypto.randomUUID를 모킹하여 결정적 테스트 보장
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

describe('useCareStore', () => {
  beforeEach(() => {
    // 각 테스트 전 스토어 상태 초기화
    useCareStore.setState({
      selectedPetId: null,
      offlineQueue: [],
    });
    uuidCounter = 0;
  });

  // --- selectedPetId ---
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

  // --- offlineQueue ---
  describe('offlineQueue', () => {
    it('초기 오프라인 큐는 빈 배열이다', () => {
      expect(useCareStore.getState().offlineQueue).toEqual([]);
    });

    it('addOfflineAction으로 액션을 큐에 추가한다', () => {
      useCareStore.getState().addOfflineAction({
        type: 'complete',
        careItemId: 'care-1',
        payload: { memo: '완료' },
      });

      const queue = useCareStore.getState().offlineQueue;
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        type: 'complete',
        careItemId: 'care-1',
        payload: { memo: '완료' },
      });
    });

    it('추가된 액션에 id와 createdAt이 자동 생성된다', () => {
      useCareStore.getState().addOfflineAction({
        type: 'skip',
        careItemId: 'care-2',
        payload: {},
      });

      const action = useCareStore.getState().offlineQueue[0];
      expect(action.id).toBe('test-uuid-1');
      expect(action.createdAt).toBeDefined();
      // ISO 8601 형식인지 확인
      expect(new Date(action.createdAt).toISOString()).toBe(action.createdAt);
    });

    it('여러 액션을 순서대로 추가할 수 있다', () => {
      useCareStore.getState().addOfflineAction({
        type: 'complete',
        careItemId: 'care-1',
        payload: {},
      });
      useCareStore.getState().addOfflineAction({
        type: 'skip',
        careItemId: 'care-2',
        payload: {},
      });
      useCareStore.getState().addOfflineAction({
        type: 'postpone',
        careItemId: 'care-3',
        payload: { days: 3 },
      });

      const queue = useCareStore.getState().offlineQueue;
      expect(queue).toHaveLength(3);
      expect(queue[0].careItemId).toBe('care-1');
      expect(queue[1].careItemId).toBe('care-2');
      expect(queue[2].careItemId).toBe('care-3');
    });

    it('clearOfflineQueue로 큐를 비운다', () => {
      useCareStore.getState().addOfflineAction({
        type: 'complete',
        careItemId: 'care-1',
        payload: {},
      });
      useCareStore.getState().addOfflineAction({
        type: 'skip',
        careItemId: 'care-2',
        payload: {},
      });

      useCareStore.getState().clearOfflineQueue();
      expect(useCareStore.getState().offlineQueue).toEqual([]);
    });

    it('removeOfflineAction으로 특정 액션만 제거한다', () => {
      useCareStore.getState().addOfflineAction({
        type: 'complete',
        careItemId: 'care-1',
        payload: {},
      });
      useCareStore.getState().addOfflineAction({
        type: 'skip',
        careItemId: 'care-2',
        payload: {},
      });

      const firstId = useCareStore.getState().offlineQueue[0].id;
      useCareStore.getState().removeOfflineAction(firstId);

      const queue = useCareStore.getState().offlineQueue;
      expect(queue).toHaveLength(1);
      expect(queue[0].careItemId).toBe('care-2');
    });

    it('존재하지 않는 ID로 removeOfflineAction을 호출해도 오류가 없다', () => {
      useCareStore.getState().addOfflineAction({
        type: 'complete',
        careItemId: 'care-1',
        payload: {},
      });

      useCareStore.getState().removeOfflineAction('nonexistent-id');
      expect(useCareStore.getState().offlineQueue).toHaveLength(1);
    });
  });

  // --- 상태 독립성 ---
  describe('상태 독립성', () => {
    it('selectedPetId 변경이 offlineQueue에 영향을 주지 않는다', () => {
      useCareStore.getState().addOfflineAction({
        type: 'complete',
        careItemId: 'care-1',
        payload: {},
      });

      useCareStore.getState().setSelectedPetId('pet-1');

      expect(useCareStore.getState().offlineQueue).toHaveLength(1);
    });

    it('offlineQueue 변경이 selectedPetId에 영향을 주지 않는다', () => {
      useCareStore.getState().setSelectedPetId('pet-1');

      useCareStore.getState().addOfflineAction({
        type: 'complete',
        careItemId: 'care-1',
        payload: {},
      });

      expect(useCareStore.getState().selectedPetId).toBe('pet-1');
    });
  });
});
