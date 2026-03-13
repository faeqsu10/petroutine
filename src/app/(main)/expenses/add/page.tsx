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
    await createExpense.mutateAsync({
      petId: values.petId,
      categoryId: values.categoryId,
      amount: values.amount,
      description: values.description,
      expenseDate: values.expenseDate,
      memo: values.memo ?? null,
    });
    router.push('/expenses');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center gap-2 bg-white px-4 py-3 shadow-sm">
        <Link href="/expenses">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-base font-semibold text-gray-800">지출 추가</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4 pt-6">
        {/* 금액 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <Label className="mb-2 block text-sm font-medium text-gray-500">금액</Label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              className={cn(
                'w-full bg-transparent text-center text-4xl font-bold text-gray-800 outline-none placeholder:text-gray-300',
                errors.amount && 'text-red-500',
              )}
              {...register('amount', { valueAsNumber: true })}
            />
            <span className="text-2xl font-semibold text-gray-500">원</span>
          </div>
          {errors.amount && (
            <p className="mt-1 text-center text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* 내용 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <Label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-500">
            내용
          </Label>
          <Input
            id="description"
            placeholder="예: 정기 예방접종"
            className="rounded-xl border-gray-200"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* 카테고리 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <Label className="mb-3 block text-sm font-medium text-gray-500">카테고리</Label>
          {categoriesLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue('categoryId', cat.id, { shouldValidate: true })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100',
                    )}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className={cn('text-xs font-medium', isSelected ? 'text-indigo-600' : 'text-gray-600')}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.categoryId && (
            <p className="mt-2 text-xs text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        {/* 반려동물 */}
        {pets.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <Label className="mb-3 block text-sm font-medium text-gray-500">반려동물</Label>
            <div className="flex flex-wrap gap-2">
              {petsLoading ? (
                <div className="h-9 w-20 animate-pulse rounded-full bg-gray-100" />
              ) : (
                pets.map((pet) => {
                  const isSelected = selectedPetId === pet.id;
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setValue('petId', pet.id, { shouldValidate: true })}
                      className={cn(
                        'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300',
                      )}
                    >
                      {pet.name}
                    </button>
                  );
                })
              )}
            </div>
            {errors.petId && (
              <p className="mt-2 text-xs text-red-500">{errors.petId.message}</p>
            )}
          </div>
        )}

        {/* 날짜 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <Label htmlFor="expenseDate" className="mb-2 block text-sm font-medium text-gray-500">
            날짜
          </Label>
          <Input
            id="expenseDate"
            type="date"
            className="rounded-xl border-gray-200"
            {...register('expenseDate')}
          />
          {errors.expenseDate && (
            <p className="mt-1 text-xs text-red-500">{errors.expenseDate.message}</p>
          )}
        </div>

        {/* 메모 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <Label htmlFor="memo" className="mb-2 block text-sm font-medium text-gray-500">
            메모 <span className="text-gray-400">(선택)</span>
          </Label>
          <Textarea
            id="memo"
            placeholder="추가 메모를 입력해 주세요"
            rows={3}
            className="resize-none rounded-xl border-gray-200"
            {...register('memo')}
          />
        </div>

        {/* 저장 버튼 */}
        <Button
          type="submit"
          disabled={isSubmitting || createExpense.isPending}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting || createExpense.isPending ? '저장 중...' : '저장하기'}
        </Button>
      </form>
    </div>
  );
}
