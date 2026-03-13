'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { usePets } from '@/hooks/use-pets';
import { useCareItems } from '@/hooks/use-care-items';
import { useCareStore } from '@/stores/care-store';
import { getScheduleUrgency, getDdayText, getUrgencyColor, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompleteModal } from '@/components/care/complete-modal';
import { CareEditSheet } from '@/components/care/edit-sheet';
import type { CareItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function CarePage() {
  const { data: pets } = usePets();
  const selectedPetId = useCareStore((s) => s.selectedPetId);
  const setSelectedPetId = useCareStore((s) => s.setSelectedPetId);
  const activePetId = selectedPetId ?? pets?.[0]?.id ?? null;
  const { data: careItems, isLoading } = useCareItems(activePetId);
  const [completingItem, setCompletingItem] = useState<CareItem | null>(null);
  const [editingItem, setEditingItem] = useState<CareItem | null>(null);

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
    <div className="space-y-8 px-5 pb-32 pt-10">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground/90">케어 관리</h1>
          <p className="text-sm font-medium text-muted-foreground">우리 아이의 루틴을 챙겨주세요</p>
        </div>
        <Link href="/care/add">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary/10 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
          >
            <Plus className="h-4 w-4" />
            추가
          </motion.button>
        </Link>
      </header>

      {/* 반려동물 선택 - 프리미엄 탭 스타일 */}
      {pets && pets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                activePetId === pet.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
              }`}
            >
              {pet.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground/60">로딩 중...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-item flex flex-col items-center gap-4 bg-card/40 glass py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-4xl shadow-inner">
            📋
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground/80">등록된 케어 항목이 없어요</p>
            <p className="text-xs text-muted-foreground">첫 번째 케어 항목을 추가하고 루틴을 시작해보세요</p>
          </div>
          <Link href="/care/add">
            <Button className="h-12 rounded-xl bg-primary px-8 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]">
              케어 항목 추가하기
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items], idx) => (
            <motion.section 
              key={category}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                {categoryLabels[category] ?? category}
              </h2>
              <div className="space-y-3">
                {items!.map((item) => {
                  const urgency = item.schedule
                    ? getScheduleUrgency(item.schedule.nextDueDate)
                    : 'pending';
                  const urgencyColor = getUrgencyColor(urgency);
                  
                  return (
                    <div
                      key={item.id}
                      className="bento-item flex items-center justify-between bg-card/40 glass p-5"
                    >
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="flex flex-1 items-center gap-4 text-left group"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl shadow-inner transition-transform group-hover:scale-105">
                          {item.icon}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold text-foreground/90">{item.name}</p>
                          <div className="flex items-center gap-2">
                            {item.schedule && (
                              <span 
                                className="text-[11px] font-black uppercase tracking-tight"
                                style={{ color: urgencyColor }}
                              >
                                {getDdayText(item.schedule.nextDueDate)}
                              </span>
                            )}
                            {item.lastLog && (
                              <span className="text-[11px] font-medium text-muted-foreground/60">
                                마지막: {formatDate(item.lastLog.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCompletingItem(item)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                      >
                        <Check className="h-5 w-5 stroke-[3px]" />
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>
      )}

      {/* 케어 완료 모달 */}
      <CompleteModal
        open={!!completingItem}
        onOpenChange={(open) => !open && setCompletingItem(null)}
        careItem={completingItem}
      />

      {/* 케어 수정 시트 */}
      <CareEditSheet
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        careItem={editingItem}
      />
    </div>
  );
}
