'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { calculateNextDueDate, toLocalDateStr } from '@/lib/utils';
import { useCreatePet } from '@/hooks/use-pets';
import { CARE_TEMPLATES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Species = 'dog' | 'cat' | 'other';

const CATEGORY_LABELS: Record<string, string> = {
  hygiene: '위생',
  health: '건강',
  daily: '생활',
};

const DEFAULT_SELECTED = ['목욕', '심장사상충 약', '건강 검진', '양치', '산책'];

const PRESET_COLOR = '#6B8DD6';

export default function OnboardingPage() {
  const router = useRouter();
  const createPet = useCreatePet();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [petId, setPetId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(DEFAULT_SELECTED),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2: 반려동물 생성
  async function handleCreatePet() {
    if (!petName.trim()) {
      toast.error('이름을 입력해주세요');
      return;
    }
    try {
      const result = await createPet.mutateAsync({
        name: petName.trim(),
        species,
        breed: null,
        birthDate: null,
        gender: null,
        neutered: false,
        weightKg: null,
        avatarUrl: null,
      });
      setPetId(result.id);
      setStep(3);
    } catch {
      toast.error('반려동물 등록에 실패했어요. 다시 시도해주세요.');
    }
  }

  // Step 3: 케어 항목 일괄 생성
  async function handleFinish() {
    if (!petId) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error('로그인이 필요해요');
      return;
    }

    const chosen = CARE_TEMPLATES.filter((t) => selectedItems.has(t.name));
    if (chosen.length === 0) {
      router.replace('/');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const batch = writeBatch(db);

      for (const template of chosen) {
        const itemRef = doc(collection(db, 'careItems'));
        batch.set(itemRef, {
          petId,
          userId: uid,
          category: template.category,
          name: template.name,
          cycleValue: template.cycleValue,
          cycleUnit: template.cycleUnit,
          icon: template.icon,
          color: PRESET_COLOR,
          isActive: true,
          notifyEnabled: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        const nextDue = calculateNextDueDate(now, template.cycleValue, template.cycleUnit);
        const scheduleRef = doc(collection(db, 'careSchedules'));
        batch.set(scheduleRef, {
          careItemId: itemRef.id,
          userId: uid,
          nextDueDate: toLocalDateStr(nextDue),
          status: 'pending',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      await batch.commit();
      toast.success('루틴 설정 완료! 대시보드로 이동합니다.');
      router.replace('/');
    } catch {
      toast.error('케어 항목 저장에 실패했어요. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  }

  function toggleItem(name: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const categories = ['hygiene', 'health', 'daily'] as const;

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-5 pb-16 pt-10">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                s === step ? 'w-8 bg-primary' : s < step ? 'w-2 bg-primary/40' : 'w-2 bg-border/60',
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: 환영 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center gap-8"
            >
              <div className="bg-primary/5 p-10 rounded-[2.5rem] border border-primary/10">
                <p className="text-7xl">🐾</p>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-foreground/90">
                  반가워요!
                </h1>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
                  우리 아이의 루틴을 설정해볼까요?<br />
                  딱 2분이면 충분해요.
                </p>
              </div>
              <Button
                onClick={() => setStep(2)}
                className="h-16 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
              >
                시작하기
              </Button>
            </motion.div>
          )}

          {/* Step 2: 반려동물 정보 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-8"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">
                  Step 1 of 2
                </p>
                <h2 className="text-2xl font-black tracking-tight text-foreground/90">
                  우리 아이를 알려주세요
                </h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  이름과 종류만 있으면 돼요
                </p>
              </div>

              <div className="bento-item bg-card/60 glass p-6 space-y-6">
                {/* 이름 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/70">
                    이름 <span className="text-primary">*</span>
                  </label>
                  <Input
                    placeholder="예: 초코, 나비"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePet()}
                    className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
                    autoFocus
                  />
                </div>

                {/* 종류 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/70">종류</label>
                  <div className="flex gap-3">
                    {(
                      [
                        { value: 'dog', label: '🐶 강아지' },
                        { value: 'cat', label: '🐱 고양이' },
                        { value: 'other', label: '🐾 기타' },
                      ] as { value: Species; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSpecies(opt.value)}
                        className={cn(
                          'flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all active:scale-[0.97]',
                          species === opt.value
                            ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                            : 'border-border/40 bg-background/50 text-muted-foreground/60',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreatePet}
                disabled={createPet.isPending || !petName.trim()}
                className="h-16 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
              >
                {createPet.isPending ? '등록 중…' : '다음'}
              </Button>
            </motion.div>
          )}

          {/* Step 3: 케어 항목 선택 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">
                  Step 2 of 2
                </p>
                <h2 className="text-2xl font-black tracking-tight text-foreground/90">
                  케어 루틴을 선택해요
                </h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  나중에 언제든 추가·삭제할 수 있어요
                </p>
              </div>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 pb-1">
                {categories.map((cat) => {
                  const items = CARE_TEMPLATES.filter((t) => t.category === cat);
                  return (
                    <div key={cat} className="bento-item bg-card/60 glass p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
                        {CATEGORY_LABELS[cat]}
                      </p>
                      <div className="space-y-2">
                        {items.map((template) => {
                          const checked = selectedItems.has(template.name);
                          return (
                            <button
                              key={template.name}
                              type="button"
                              onClick={() => toggleItem(template.name)}
                              className={cn(
                                'w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all active:scale-[0.98]',
                                checked
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'bg-background/40 border border-border/30 opacity-60',
                              )}
                            >
                              <span className="text-xl">{template.icon}</span>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-foreground/80">
                                  {template.name}
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground/60">
                                  {template.cycleValue}{template.cycleUnit === 'day' ? '일' : template.cycleUnit === 'week' ? '주' : '개월'}마다
                                </p>
                              </div>
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                                  checked
                                    ? 'border-primary bg-primary'
                                    : 'border-border/40 bg-transparent',
                                )}
                              >
                                {checked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="h-16 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-xl shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting
                    ? '저장 중…'
                    : selectedItems.size === 0
                    ? '항목 없이 시작하기'
                    : `${selectedItems.size}개 항목으로 시작하기`}
                </Button>
                <button
                  type="button"
                  onClick={() => { router.replace('/'); }}
                  className="w-full text-center text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  나중에 직접 추가할게요
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
