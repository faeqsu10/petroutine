'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { usePets } from '@/hooks/use-pets';
import { useCreateExpense } from '@/hooks/use-expenses';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const schema = z.object({
  amount: z.number({ error: '금액을 입력해 주세요' }).positive('0보다 큰 금액을 입력해 주세요').max(99_999_999, '금액은 1억 미만이어야 합니다'),
  description: z.string().min(1, '내용을 입력해 주세요').max(100, '내용은 100자 이내로 입력해 주세요'),
  categoryId: z.string().min(1, '카테고리를 선택해 주세요'),
  petId: z.string().min(1, '반려동물을 선택해 주세요'),
  expenseDate: z.string().min(1, '날짜를 선택해 주세요').regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
  memo: z.string().max(500, '메모는 500자 이내로 입력해 주세요').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AddExpensePage() {
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories();
  const { data: pets = [], isLoading: petsLoading } = usePets();
  const createExpense = useCreateExpense();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
      memo: '',
    },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedPetId = watch('petId');

  const onSubmit = async (values: FormValues) => {
    try {
      await createExpense.mutateAsync({
        petId: values.petId,
        categoryId: values.categoryId,
        amount: values.amount,
        description: values.description,
        expenseDate: values.expenseDate,
        memo: values.memo ?? null,
      });
      router.push('/expenses');
    } catch {
      alert('저장에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-dvh px-5 pb-32 pt-8">
      {/* 헤더 */}
      <header className="mb-10">
        <Link href="/expenses">
          <button
            className="group mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span>뒤로가기</span>
          </button>
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-foreground/90">지출 추가</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">아이에게 사용한 비용을 기록하세요</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 금액 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-item bg-primary text-white p-8 shadow-lg shadow-primary/20"
        >
          <Label className="mb-4 block text-xs font-bold uppercase tracking-widest opacity-70">지출 금액</Label>
          <div className="flex items-baseline justify-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              autoFocus
              className={cn(
                'w-full bg-transparent text-center text-5xl font-black outline-none placeholder:text-white/30',
                errors.amount && 'text-red-200',
              )}
              {...register('amount', { valueAsNumber: true })}
            />
            <span className="text-2xl font-bold opacity-80">원</span>
          </div>
          {errors.amount && (
            <p className="mt-2 text-center text-xs font-bold text-red-200">{errors.amount.message}</p>
          )}
        </motion.div>

        {/* 카테고리 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bento-item bg-card/60 glass p-6"
        >
          <Label className="mb-4 block text-xs font-bold uppercase tracking-widest text-muted-foreground/80">카테고리</Label>
          {categoriesLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-background/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue('categoryId', cat.id, { shouldValidate: true })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-4 transition-all active:scale-90',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
                        : 'border-border/40 bg-background/50 hover:bg-background/80',
                    )}
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <span className={cn('text-[11px] font-bold', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.categoryId && (
            <p className="mt-2 text-xs font-bold text-destructive">{errors.categoryId.message}</p>
          )}
        </motion.div>

        {/* 반려동물 및 날짜 정보 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bento-item bg-card/60 glass p-6 space-y-8"
        >
          {/* 내용 */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              지출 내용
            </Label>
            <Input
              id="description"
              placeholder="예: 정기 예방접종"
              className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs font-bold text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* 반려동물 */}
          {pets.length > 0 && (
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">반려동물</Label>
              <div className="flex flex-wrap gap-2">
                {petsLoading ? (
                  <div className="h-10 w-24 animate-pulse rounded-2xl bg-background/50" />
                ) : (
                  pets.map((pet) => {
                    const isSelected = selectedPetId === pet.id;
                    return (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => setValue('petId', pet.id, { shouldValidate: true })}
                        className={cn(
                          'rounded-2xl border-2 px-5 py-2.5 text-sm font-bold transition-all active:scale-95',
                          isSelected
                            ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                            : 'border-border/40 bg-background/50 text-muted-foreground/60 hover:border-primary/40',
                        )}
                      >
                        {pet.name}
                      </button>
                    );
                  })
                )}
              </div>
              {errors.petId && (
                <p className="text-xs font-bold text-destructive">{errors.petId.message}</p>
              )}
            </div>
          )}

          {/* 날짜 */}
          <div className="space-y-3">
            <Label htmlFor="expenseDate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              지출 날짜
            </Label>
            <Input
              id="expenseDate"
              type="date"
              className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
              {...register('expenseDate')}
            />
            {errors.expenseDate && (
              <p className="text-xs font-bold text-destructive">{errors.expenseDate.message}</p>
            )}
          </div>

          {/* 메모 */}
          <div className="space-y-3">
            <Label htmlFor="memo" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              상세 메모 <span className="text-[10px] opacity-40">(선택)</span>
            </Label>
            <Textarea
              id="memo"
              placeholder="추가적인 정보를 메모해 보세요"
              rows={3}
              className="resize-none rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
              {...register('memo')}
            />
          </div>
        </motion.div>

        {/* 저장 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            type="submit"
            disabled={isSubmitting || createExpense.isPending}
            className="h-16 w-full rounded-2xl bg-primary text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting || createExpense.isPending ? '기록하는 중...' : '지출 내역 저장하기'}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
