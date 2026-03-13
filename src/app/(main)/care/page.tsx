'use client';

import { usePets } from '@/hooks/use-pets';
import { useCareItems } from '@/hooks/use-care-items';
import { useCareStore } from '@/stores/care-store';
import { getScheduleUrgency, getDdayText, getUrgencyColor, formatDate } from '@/lib/utils';

export default function CarePage() {
  const { data: pets } = usePets();
  const { selectedPetId, setSelectedPetId } = useCareStore();
  const activePetId = selectedPetId ?? pets?.[0]?.id ?? null;
  const { data: careItems, isLoading } = useCareItems(activePetId);

  const grouped = (careItems ?? []).reduce(
    (acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, typeof careItems>,
  );

  const categoryLabels: Record<string, string> = {
    hygiene: '🧼 위생',
    health: '💊 건강',
    daily: '🏠 생활',
    custom: '📋 기타',
  };

  return (
    <div className="space-y-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold text-gray-800">케어 관리</h1>

      {/* 반려동물 선택 */}
      {pets && pets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
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

      {isLoading ? (
        <p className="text-center text-gray-400">로딩 중...</p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">
              {categoryLabels[category] ?? category}
            </h2>
            <div className="space-y-2">
              {items!.map((item) => {
                const urgency = item.schedule
                  ? getScheduleUrgency(item.schedule.nextDueDate)
                  : 'pending';
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <div className="flex gap-2 text-xs text-gray-400">
                          {item.lastLog && (
                            <span>마지막: {formatDate(item.lastLog.completedAt)}</span>
                          )}
                          {item.schedule && (
                            <span style={{ color: getUrgencyColor(urgency) }}>
                              {getDdayText(item.schedule.nextDueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-transform active:scale-95">
                      완료
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
