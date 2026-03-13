'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Bell, ChevronRight, TrendingUp } from 'lucide-react';
import { usePets } from '@/hooks/use-pets';
import { useCareItems } from '@/hooks/use-care-items';
import { useCareStore } from '@/stores/care-store';
import { getScheduleUrgency, getDdayText, getUrgencyColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompleteModal } from '@/components/care/complete-modal';
import type { CareItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const { data: pets, isLoading: petsLoading } = usePets();
  const selectedPetId = useCareStore((s) => s.selectedPetId);
  const setSelectedPetId = useCareStore((s) => s.setSelectedPetId);
  const [completingItem, setCompletingItem] = useState<CareItem | null>(null);

  const activePetId = selectedPetId ?? pets?.[0]?.id ?? null;
  const { data: careItems } = useCareItems(activePetId);

  if (petsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-4xl"
        >
          🐾
        </motion.div>
      </div>
    );
  }

  if (!pets?.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="bg-primary/10 p-8 rounded-full">
          <p className="text-6xl">🐾</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight">아이를 처음 만났나요?</h2>
          <p className="text-muted-foreground leading-relaxed">
            기억에 의존하지 않는 반려동물 관리,<br />프로필 등록부터 시작해보세요.
          </p>
        </div>
        <Link href="/pets/add">
          <Button className="h-14 rounded-2xl bg-primary px-10 text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95">
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
  }).slice(0, 3);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background px-6 pb-32 pt-10">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Premium Pet Concierge</p>
          <h1 className="text-2xl font-extrabold tracking-tight">반가워요, {pets[0]?.name} 보호자님!</h1>
        </div>
        <button className="relative bg-card p-3 rounded-2xl shadow-bento border border-border">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-4 ring-card" />
        </button>
      </header>

      {/* Pet Selector (Pills) */}
      {pets.length > 1 && (
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                activePetId === pet.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {pet.name}
            </button>
          ))}
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Tasks Bento (Wide) */}
        <section className="col-span-2 bento-item p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              오늘 할 일
              {todayItems.length > 0 && (
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs">
                  {todayItems.length}
                </span>
              )}
            </h2>
            <Link href="/care" className="text-muted-foreground hover:text-primary transition-colors">
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <AnimatePresence mode="popLayout">
            {todayItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-6 text-center space-y-3"
              >
                <div className="bg-green-50 p-4 rounded-full">
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-sm font-medium text-green-700">모든 케어를 완료했습니다!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {todayItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between bg-background/50 p-3 rounded-2xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl bg-white p-2 rounded-xl shadow-sm">{item.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p
                          className="text-[10px] font-bold"
                          style={{ color: getUrgencyColor(getScheduleUrgency(item.schedule!.nextDueDate)) }}
                        >
                          {getDdayText(item.schedule!.nextDueDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setCompletingItem(item)}
                      className="h-9 px-4 rounded-xl bg-primary text-xs font-bold text-white shadow-md shadow-primary/10"
                    >
                      완료
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Expense Bento (Small) */}
        <Link href="/expenses" className="bento-item p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="bg-indigo-50 p-2 rounded-xl">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">이번 달 지출</p>
            <p className="text-lg font-black tracking-tight">₩245,000</p>
          </div>
        </Link>

        {/* Pet Condition Bento (Small) */}
        <div className="bento-item p-5 flex flex-col justify-between bg-primary/5 border-primary/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <p className="text-[10px] font-bold text-primary">컨디션 맑음</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">체중</p>
            <p className="text-lg font-black tracking-tight">5.4kg</p>
          </div>
        </div>

        {/* Upcoming Bento (Wide) */}
        <section className="col-span-2 bento-item p-6">
          <h2 className="font-extrabold text-sm text-muted-foreground mb-4">다가오는 주요 일정</h2>
          <div className="space-y-4">
            {upcomingItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 group">
                <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.name}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {getDdayText(item.schedule!.nextDueDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Add Button */}
      <Link href="/care/add" className="fixed bottom-24 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/40 border-4 border-white"
        >
          <Plus className="h-8 w-8 text-white" />
        </motion.button>
      </Link>

      {/* Modal */}
      <CompleteModal
        open={!!completingItem}
        onOpenChange={(open) => !open && setCompletingItem(null)}
        careItem={completingItem}
      />
    </div>
  );
}
