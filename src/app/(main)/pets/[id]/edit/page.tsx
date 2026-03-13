'use client';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { usePets, useUpdatePet, useDeletePet } from '@/hooks/use-pets';
import { cn } from '@/lib/utils';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

const petSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  neutered: z.boolean(),
  weightKg: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === '' || (!isNaN(parseFloat(v)) && parseFloat(v) > 0),
      '올바른 체중을 입력해주세요',
    ),
});

type PetFormValues = z.infer<typeof petSchema>;

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;
  const { data: pets } = usePets();
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pet = pets?.find((p) => p.id === petId);

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: '',
      species: 'dog',
      breed: '',
      birthDate: '',
      gender: 'unknown',
      neutered: false,
      weightKg: '',
    },
  });

  useEffect(() => {
    if (pet) {
      form.reset({
        name: pet.name,
        species: pet.species,
        breed: pet.breed ?? '',
        birthDate: pet.birthDate ?? '',
        gender: pet.gender ?? 'unknown',
        neutered: pet.neutered,
        weightKg: pet.weightKg != null ? String(pet.weightKg) : '',
      });
    }
  }, [pet, form]);

  async function onSubmit(values: PetFormValues) {
    const weightKg =
      values.weightKg && values.weightKg.trim() !== ''
        ? parseFloat(values.weightKg)
        : null;

    await updatePet.mutateAsync({
      id: petId,
      name: values.name,
      species: values.species,
      breed: values.breed && values.breed.trim() !== '' ? values.breed : null,
      birthDate: values.birthDate && values.birthDate.trim() !== '' ? values.birthDate : null,
      gender: values.gender ?? null,
      neutered: values.neutered,
      weightKg,
    });
    router.push('/settings');
  }

  function handleDelete() {
    deletePet.mutate(petId, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        router.push('/settings');
      },
    });
  }

  if (!pet) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 px-4 pb-10 pt-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 active:opacity-70"
          >
            <span>←</span>
            <span>뒤로</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">반려동물 수정</h1>
          <p className="mt-1 text-sm text-gray-500">{pet.name}의 정보를 수정합니다</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 기본 정보 카드 */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                기본 정보
              </h2>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        이름 <span className="text-indigo-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 초코, 나비"
                          className="rounded-xl border-gray-200 focus-visible:ring-indigo-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">종류</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full rounded-xl border-gray-200">
                            <SelectValue placeholder="종류를 선택해주세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dog">강아지</SelectItem>
                          <SelectItem value="cat">고양이</SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">품종</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 말티즈, 코리안숏헤어"
                          className="rounded-xl border-gray-200 focus-visible:ring-indigo-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 상세 정보 카드 */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                상세 정보
              </h2>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">생년월일</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="rounded-xl border-gray-200 focus-visible:ring-indigo-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">성별</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full rounded-xl border-gray-200">
                            <SelectValue placeholder="성별을 선택해주세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">수컷</SelectItem>
                          <SelectItem value="female">암컷</SelectItem>
                          <SelectItem value="unknown">미확인</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neutered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">중성화 여부</FormLabel>
                      <FormControl>
                        <div className="flex gap-3 pt-1">
                          {(
                            [
                              { value: true, label: '완료' },
                              { value: false, label: '미완료' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={String(opt.value)}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                'flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors active:scale-[0.98]',
                                field.value === opt.value
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                  : 'border-gray-200 bg-white text-gray-500',
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">체중 (kg)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="예: 3.5"
                            className="rounded-xl border-gray-200 pr-10 focus-visible:ring-indigo-500"
                            {...field}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                            kg
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 저장 버튼 */}
            <Button
              type="submit"
              disabled={updatePet.isPending}
              className={cn(
                'w-full rounded-2xl bg-indigo-600 py-6 text-base font-semibold text-white shadow-sm',
                'hover:bg-indigo-700 active:scale-[0.98]',
                'disabled:opacity-60',
              )}
            >
              {updatePet.isPending ? '저장 중...' : '저장하기'}
            </Button>

            {updatePet.isError && (
              <p className="text-center text-sm text-red-500">
                수정에 실패했어요. 다시 시도해주세요.
              </p>
            )}
          </form>
        </Form>

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-6 w-full py-3 text-center text-sm font-medium text-red-400 hover:text-red-500"
        >
          반려동물 삭제
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="반려동물 삭제"
        description={`${pet.name}을(를) 삭제하시겠습니까? 관련 케어 기록은 유지됩니다.`}
        onConfirm={handleDelete}
        isPending={deletePet.isPending}
      />
    </div>
  );
}
