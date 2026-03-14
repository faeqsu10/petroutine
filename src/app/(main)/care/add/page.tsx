'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { usePets } from '@/hooks/use-pets';
import { useCareStore } from '@/stores/care-store';
import { useCreateCareItem } from '@/hooks/use-create-care-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { motion } from 'framer-motion';

const PRESET_COLORS = ['#FF7E5F', '#FFB347', '#48C6EF', '#6B8DD6', '#764BA2', '#6A11CB'];
const PRESET_ICONS = ['🛁', '💊', '💉', '✂️', '🦷', '🐾', '🍖', '🏥', '🧴', '👁️', '🦴', '🚿'];

const CATEGORY_LABELS: Record<string, string> = {
  hygiene: '위생',
  health: '건강',
  daily: '생활',
  custom: '기타',
};

const CYCLE_UNIT_LABELS: Record<string, string> = {
  day: '일',
  week: '주',
  month: '개월',
};

const formSchema = z.object({
  name: z.string().min(1, '항목 이름을 입력해주세요').max(30, '이름은 30자 이내로 입력해주세요'),
  category: z.enum(['hygiene', 'health', 'daily', 'custom']),
  cycleValue: z.number().int().min(1, '주기는 1 이상이어야 합니다').max(365, '주기는 365 이하여야 합니다'),
  cycleUnit: z.enum(['day', 'week', 'month']),
  icon: z.string().min(1, '아이콘을 선택해주세요'),
  color: z.string().min(1, '색상을 선택해주세요'),
  notifyEnabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddCareItemPage() {
  const router = useRouter();
  const { data: pets } = usePets();
  const selectedPetId = useCareStore((s) => s.selectedPetId);
  const activePetId = selectedPetId ?? pets?.[0]?.id ?? null;
  const { mutate: createCareItem, isPending } = useCreateCareItem();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'hygiene',
      cycleValue: 1,
      cycleUnit: 'week',
      icon: '🐾',
      color: '#FF7E5F',
      notifyEnabled: true,
    },
  });

  function onSubmit(values: FormValues) {
    if (!activePetId) {
      alert('반려동물을 먼저 등록해주세요.');
      router.push('/pets/add');
      return;
    }

    createCareItem(
      {
        petId: activePetId,
        category: values.category,
        name: values.name,
        cycleValue: values.cycleValue,
        cycleUnit: values.cycleUnit,
        icon: values.icon,
        color: values.color,
        notifyEnabled: values.notifyEnabled,
      },
      {
        onSuccess: () => {
          router.push('/care');
        },
        onError: (error) => {
          alert(`저장에 실패했어요: ${error.message}`);
        },
      },
    );
  }

  return (
    <div className="min-h-dvh px-5 pb-32 pt-8">
      <header className="mb-10">
        <button
          onClick={() => router.back()}
          className="group mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span>뒤로가기</span>
        </button>
        <h1 className="text-3xl font-black tracking-tight text-foreground/90">케어 항목 추가</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">아이의 건강한 루틴을 만들어주세요</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-item bg-card/60 glass p-6 space-y-8"
          >
            {/* 항목 이름 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-foreground/70">항목 이름</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 목욕, 심장사상충 약"
                      className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 카테고리 */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-foreground/70">카테고리</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl border-border/40 bg-background/50">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-border/40">
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 주기 */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-foreground/70">실행 주기</Label>
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="cycleValue"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cycleUnit"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-border/40 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-border/40">
                          {Object.entries(CYCLE_UNIT_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label} 마다
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bento-item bg-card/60 glass p-6 space-y-8"
          >
            {/* 아이콘 */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-foreground/70">대표 아이콘</FormLabel>
                  <div className="grid grid-cols-6 gap-3 pt-2">
                    {PRESET_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => field.onChange(emoji)}
                        className={cn(
                          'flex aspect-square items-center justify-center rounded-2xl text-2xl transition-all active:scale-90',
                          field.value === emoji
                            ? 'bg-primary/10 ring-2 ring-primary shadow-sm shadow-primary/10'
                            : 'bg-background/50 border border-border/40 text-muted-foreground/60 hover:bg-background/80',
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 색상 */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-foreground/70">포인트 컬러</FormLabel>
                  <div className="flex justify-between px-1 pt-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className={cn(
                          'h-9 w-9 rounded-full transition-all active:scale-90',
                          field.value === color ? 'ring-2 ring-primary ring-offset-4 ring-offset-background' : 'hover:scale-110',
                        )}
                        style={{
                          backgroundColor: color,
                        }}
                        aria-label={color}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 알림 */}
            <FormField
              control={form.control}
              name="notifyEnabled"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-4.5 border border-primary/10">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-primary">스마트 알림</p>
                      <p className="text-[11px] font-medium text-primary/60">알림 기능은 준비 중이에요</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        'relative h-7 w-12 rounded-full transition-colors',
                        field.value ? 'bg-primary' : 'bg-muted-foreground/20',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                          field.value ? 'right-1' : 'left-1',
                        )}
                      />
                    </button>
                  </div>
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              type="submit"
              disabled={isPending}
              className="h-16 w-full rounded-2xl bg-primary text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] transition-all"
            >
              {isPending ? '저장하는 중…' : '케어 항목 저장하기'}
            </Button>
          </motion.div>
        </form>
      </Form>
    </div>
  );
}
