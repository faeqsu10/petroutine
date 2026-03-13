'use client';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { usePets, useUpdatePet, useDeletePet } from '@/hooks/use-pets';
import { cn } from '@/lib/utils';
import { ChevronLeft, Trash2 } from 'lucide-react';
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
import { motion } from 'framer-motion';

const petSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(30, '이름은 30자 이내로 입력해주세요'),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().max(30, '품종은 30자 이내로 입력해주세요').optional(),
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm font-medium text-muted-foreground/60">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-5 pb-32 pt-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="mb-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="group mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span>뒤로가기</span>
          </button>
          <h1 className="text-3xl font-black tracking-tight text-foreground/90">반려동물 수정</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">{pet.name}의 정보를 수정합니다</p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 기본 정보 카드 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-item bg-card/60 glass p-6"
            >
              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                기본 정보
              </h2>
              <div className="grid gap-6">
                {/* 이름 */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-foreground/70">
                        이름 <span className="text-primary">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 초코, 나비"
                          className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* 종류 */}
                  <FormField
                    control={form.control}
                    name="species"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-foreground/70">종류</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-border/40 bg-background/50">
                              <SelectValue placeholder="종류" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/40">
                            <SelectItem value="dog">🐶 강아지</SelectItem>
                            <SelectItem value="cat">🐱 고양이</SelectItem>
                            <SelectItem value="other">🐾 기타</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 품종 */}
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-foreground/70">품종</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="예: 말티즈"
                            className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </motion.div>

            {/* 상세 정보 카드 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bento-item bg-card/60 glass p-6"
            >
              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                상세 정보
              </h2>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* 생년월일 */}
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-foreground/70">생년월일</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-12 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 성별 */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-foreground/70">성별</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-border/40 bg-background/50">
                              <SelectValue placeholder="성별" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/40">
                            <SelectItem value="male">수컷</SelectItem>
                            <SelectItem value="female">암컷</SelectItem>
                            <SelectItem value="unknown">미확인</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 중성화 여부 */}
                <FormField
                  control={form.control}
                  name="neutered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-foreground/70">중성화 여부</FormLabel>
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
                                'flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all active:scale-[0.97]',
                                field.value === opt.value
                                  ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                                  : 'border-border/40 bg-background/50 text-muted-foreground/60',
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

                {/* 체중 */}
                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-foreground/70">체중 (kg)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="예: 3.5"
                            className="h-12 rounded-xl border-border/40 bg-background/50 pr-12 focus-visible:ring-primary"
                            {...field}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/40">
                            kg
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            {/* 저장 버튼 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <Button
                type="submit"
                disabled={updatePet.isPending}
                className={cn(
                  'h-16 w-full rounded-2xl bg-primary text-lg font-bold text-white shadow-lg shadow-primary/20',
                  'hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] transition-all',
                  'disabled:opacity-60',
                )}
              >
                {updatePet.isPending ? '저장 중...' : '정보 수정 완료하기'}
              </Button>

              {updatePet.isError && (
                <p className="text-center text-sm font-medium text-destructive">
                  수정에 실패했어요. 다시 시도해주세요.
                </p>
              )}
            </motion.div>
          </form>
        </Form>

        {/* 삭제 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="group mt-10 flex w-full items-center justify-center gap-2 py-4 text-sm font-bold text-destructive/50 transition-colors hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            반려동물 삭제하기
          </button>
        </motion.div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="반려동물 삭제"
        description={`${pet.name}을(를) 정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.`}
        onConfirm={handleDelete}
        isPending={deletePet.isPending}
      />
    </div>
  );
}
