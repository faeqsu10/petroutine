'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { usePets } from '@/hooks/use-pets';
import { useCareItems } from '@/hooks/use-care-items';
import { useMonthlyStats } from '@/hooks/use-expenses';
import { useCareStore } from '@/stores/care-store';
import { getScheduleUrgency, getDdayText, getUrgencyColor } from '@/lib/utils';
import { BOTTOM_NAV_PADDING } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { CompleteModal } from '@/components/care/complete-modal';
import type { CareItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();
  const { data: pets, isLoading: petsLoading, isError: petsError } = usePets();
  const selectedPetId = useCareStore((s) => s.selectedPetId);
  const setSelectedPetId = useCareStore((s) => s.setSelectedPetId);
  const [completingItem, setCompletingItem] = useState<CareItem | null>(null);

  useEffect(() => {
    if (!petsLoading && !petsError && pets && pets.length === 0) {
      router.replace('/onboarding');
    }
  }, [pets, petsLoading, petsError, router]);

  // selectedPetId: null → 전체 보기, string → 특정 펫
  const activePetId = selectedPetId;
  const { data: careItems } = useCareItems(activePetId);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: monthlyStats } = useMonthlyStats(currentMonth);
  const totalAmount = monthlyStats?.totalAmount ?? 0;

  const activePet = pets?.find((p) => p.id === activePetId) ?? null;

  if (petsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl"
        >
          🐾
        </motion.div>
        <p className="text-sm font-bold text-primary/40 animate-pulse uppercase tracking-widest">Loading</p>
      </div>
    );
  }

  if (petsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-5">
        <p className="text-sm font-medium text-destructive">데이터를 불러오지 못했어요</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-bold text-primary"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  if (!pets?.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-8 text-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 p-10 rounded-[2.5rem] border border-primary/10"
        >
          <p className="text-7xl">🐾</p>
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-foreground/90">아이를 처음 만났나요?</h2>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
            기억에 의존하지 않는 반려동물 관리,<br />프로필 등록부터 시작해보세요.
          </p>
        </div>
        <Link href="/pets/add">
          <Button className="h-16 rounded-2xl bg-primary px-12 text-base font-bold text-white shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95">
            반려동물 등록하기
          </Button>
        </Link>
      </div>
    );
  }

  const recentlyCompleted = (careItems ?? [])
    .filter((item) => item.lastLog)
    .sort((a, b) => new Date(b.lastLog!.completedAt).getTime() - new Date(a.lastLog!.completedAt).getTime())
    .slice(0, 3);

  const todayItems = (careItems ?? []).filter((item) => {
    if (!item.schedule) return false;
    const urgency = getScheduleUrgency(item.schedule.nextDueDate);
    return urgency === 'overdue' || urgency === 'due';
  });

  const upcomingItems = (careItems ?? []).filter((item) => {
    if (!item.schedule) return false;
    if (getScheduleUrgency(item.schedule.nextDueDate) !== 'pending') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    const dueDate = new Date(item.schedule.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= sevenDaysLater;
  });

  return (
    <div className={`max-w-md mx-auto min-h-screen px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
      {/* Header */}
      <header className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Premium Pet Concierge</p>
        <h1 className="text-2xl font-black tracking-tight text-foreground/90">
          {activePet ? `반가워요, ${activePet.name} 보호자님!` : '반가워요, 보호자님!'}
        </h1>
      </header>

      {/* Pet Selector (Pills) */}
      <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedPetId(null)}
          className={`shrink-0 rounded-2xl px-6 py-2.5 text-sm font-bold transition-all ${
            activePetId === null
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
              : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
          }`}
        >
          전체
        </button>
        {pets.map((pet) => (
          <button
            key={pet.id}
            onClick={() => setSelectedPetId(pet.id)}
            className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-all ${
              activePetId === pet.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                : 'bg-card/40 text-muted-foreground glass hover:bg-card/60'
            }`}
          >
            {pet.avatarUrl ? (
              <Image
                src={pet.avatarUrl}
                alt={pet.name}
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <span className="text-base leading-none">
                {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}
              </span>
            )}
            {pet.name}
          </button>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Tasks Bento (Wide) */}
        <section className="col-span-2 bento-item bg-card/60 glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-lg tracking-tight flex items-center gap-2 text-foreground/80">
              오늘 할 일
              {todayItems.length > 0 && (
                <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-[10px] font-black">
                  {todayItems.length}
                </span>
              )}
            </h2>
            <Link href="/care" className="text-muted-foreground/40 hover:text-primary transition-colors">
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <AnimatePresence mode="popLayout">
            {todayItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center space-y-4"
              >
                <div className="bg-primary/5 p-5 rounded-[2rem]">
                  <Sparkles className="w-8 h-8 text-primary/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground/70">완벽한 하루예요!</p>
                  <p className="text-[11px] font-medium text-muted-foreground/60">오늘의 모든 케어를 완료했습니다</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {todayItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between bg-background/40 p-3.5 rounded-2xl border border-border/40"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl bg-white/80 shadow-inner p-2 rounded-xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-foreground/80">{item.name}</p>
                        <p
                          className="text-[10px] font-black uppercase tracking-tight"
                          style={{ color: getUrgencyColor(getScheduleUrgency(item.schedule!.nextDueDate)) }}
                        >
                          {getDdayText(item.schedule!.nextDueDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setCompletingItem(item)}
                      className="h-10 px-5 rounded-xl bg-primary text-[11px] font-black text-white shadow-lg shadow-primary/15 active:scale-95 transition-all"
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
        <Link href="/expenses" className="bento-item bg-card/60 glass p-5 flex flex-col justify-between aspect-square group">
          <div className="flex items-center justify-between">
            <div className="bg-primary/5 p-2.5 rounded-xl group-hover:bg-primary/10 transition-colors">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">이번 달 지출</p>
            <p className="text-xl font-black tracking-tighter text-foreground/80">₩{totalAmount.toLocaleString()}</p>
          </div>
        </Link>

        {/* Pet Weight Bento (Small) */}
        <div className="bento-item bg-primary/5 glass border-primary/10 p-5 flex flex-col justify-between aspect-square">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">아이 체중</p>
            <p className="text-xl font-black tracking-tighter text-foreground/80">
              {activePet?.weightKg != null ? `${activePet.weightKg}kg` : '미등록'}
            </p>
          </div>
        </div>

        {/* Upcoming Bento (Wide) */}
        <section className="col-span-2 bento-item bg-card/60 glass p-6">
          <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-6">다가오는 주요 일정</h2>
          {upcomingItems.length === 0 ? (
            <p className="text-xs font-medium text-muted-foreground/60 text-center py-4">7일 이내 예정된 항목이 없어요</p>
          ) : (
            <div className="space-y-5">
              {upcomingItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-all duration-300" />
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg opacity-80 group-hover:scale-125 transition-transform">{item.icon}</span>
                      <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground transition-colors">{item.name}</span>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-primary/60">
                      {getDdayText(item.schedule!.nextDueDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recently Completed Bento (Wide) */}
        {recentlyCompleted.length > 0 && (
          <section className="col-span-2 bento-item bg-card/60 glass p-6">
            <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-6">최근 완료</h2>
            <div className="space-y-4">
              {recentlyCompleted.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <span className="text-xl bg-background/40 p-2 rounded-xl">{item.icon}</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground/70">{item.name}</span>
                    <span className="text-[11px] font-black text-muted-foreground/50">
                      {format(new Date(item.lastLog!.completedAt), 'M월 d일')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Floating Add Button */}
      <Link href="/care/add" className="fixed bottom-28 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/30 border-4 border-white active:bg-primary/90 transition-colors"
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
