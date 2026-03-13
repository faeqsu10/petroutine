'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { usePets } from '@/hooks/use-pets';
import { useCareItems } from '@/hooks/use-care-items';
import { useCareStore } from '@/stores/care-store';
import { getScheduleUrgency, getDdayText, getUrgencyColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompleteModal } from '@/components/care/complete-modal';
import type { CareItem } from '@/types';

export default function HomePage() {
  const { data: pets, isLoading: petsLoading } = usePets();
  const selectedPetId = useCareStore((s) => s.selectedPetId);
  const setSelectedPetId = useCareStore((s) => s.setSelectedPetId);
  const [completingItem, setCompletingItem] = useState<CareItem | null>(null);

  const activePetId = selectedPetId ?? pets?.[0]?.id ?? null;
  const { data: careItems } = useCareItems(activePetId);

  if (petsLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-gray-400">로딩 중...</div>;
  }

  if (!pets?.length) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl">🐾</p>
        <h2 className="text-xl font-bold text-gray-800">반려동물을 등록해주세요</h2>
        <p className="text-sm text-gray-500">우리 아이의 케어를 시작해볼까요?</p>
        <Link href="/pets/add">
          <Button className="mt-2 rounded-2xl bg-indigo-600 px-8 py-5 text-base font-semibold text-white hover:bg-indigo-700 active:scale-[0.98]">
            반려동물 등록하기
          </Button>
        </Link>
      </div>
    );
  }

  const todayItems = (careItems ?? []).filter((item) => {
    if (!item.schedule) return false;
    const urgency = getScheduleUrgency(item.schedule.nextDueDate);
    return urgency === 'overdue' || urgency === 'due';
  });

  const upcomingItems = (careItems ?? []).filter((item) => {
    if (!item.schedule) return false;
    return getScheduleUrgency(item.schedule.nextDueDate) === 'pending';
  }).slice(0, 5);

  return (
    <div className="space-y-6 px-4 pb-24 pt-6">
      {/* 반려동물 선택 */}
      {pets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activePetId === pet.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {pet.name}
            </button>
          ))}
        </div>
      )}

      {/* 오늘 할 일 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-800">
          오늘 할 일 {todayItems.length > 0 && <span className="text-indigo-600">{todayItems.length}</span>}
        </h2>
        {todayItems.length === 0 ? (
          <div className="rounded-2xl bg-green-50 p-6 text-center">
            <p className="text-lg">✅</p>
            <p className="mt-1 text-sm text-green-700">오늘은 모든 케어가 완료되었어요!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p
                      className="text-xs"
                      style={{ color: getUrgencyColor(getScheduleUrgency(item.schedule!.nextDueDate)) }}
                    >
                      {getDdayText(item.schedule!.nextDueDate)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setCompletingItem(item)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95"
                >
                  완료
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 곧 다가올 일 */}
      {upcomingItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-800">곧 다가올 일</h2>
          <div className="space-y-2">
            {upcomingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {getDdayText(item.schedule!.nextDueDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 플로팅 추가 버튼 */}
      <Link href="/care/add" className="fixed bottom-24 right-4 z-40">
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg transition-transform hover:bg-indigo-700 active:scale-95">
          <Plus className="h-7 w-7 text-white" />
        </button>
      </Link>

      {/* 케어 완료 모달 */}
      <CompleteModal
        open={!!completingItem}
        onOpenChange={(open) => !open && setCompletingItem(null)}
        careItem={completingItem}
      />
    </div>
  );
}
