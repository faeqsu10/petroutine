'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useCreatePet } from '@/hooks/use-pets';
import { uploadAvatar } from '@/hooks/use-pets';
import { cn } from '@/lib/utils';
import { ChevronLeft, Camera } from 'lucide-react';
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
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

export default function AddPetPage() {
  const router = useRouter();
  const createPet = useCreatePet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지는 5MB 이하만 업로드할 수 있어요');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const speciesValue = form.watch('species');

  function getDefaultEmoji(species: string) {
    if (species === 'dog') return '🐶';
    if (species === 'cat') return '🐱';
    return '🐾';
  }

  async function onSubmit(values: PetFormValues) {
    const weightKg =
      values.weightKg && values.weightKg.trim() !== ''
        ? parseFloat(values.weightKg)
        : null;

    try {
      // 먼저 pet을 생성하여 id 확보
      const newPet = await createPet.mutateAsync({
        name: values.name,
        species: values.species,
        breed: values.breed && values.breed.trim() !== '' ? values.breed : null,
        birthDate:
          values.birthDate && values.birthDate.trim() !== '' ? values.birthDate : null,
        gender: values.gender ?? null,
        neutered: values.neutered,
        weightKg,
        avatarUrl: null,
      });

      // 아바타 파일이 있으면 업로드 후 avatarUrl 업데이트
      if (avatarFile && newPet.id) {
        try {
          const { useUpdatePet: _useUpdatePet } = await import('@/hooks/use-pets');
          void _useUpdatePet; // 직접 Firestore 업데이트
          const avatarUrl = await uploadAvatar(avatarFile, newPet.id);
          const { updateDoc, doc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/client');
          await updateDoc(doc(db, 'pets', newPet.id), { avatarUrl });
        } catch {
          // 아바타 업로드 실패는 경고만 표시 (pet 등록은 성공)
          toast.warning('프로필 사진 업로드에 실패했어요. 나중에 수정 페이지에서 다시 시도해주세요.');
        }
      }

      toast.success('반려동물이 등록됐어요');
      router.push('/');
    } catch {
      toast.error('저장에 실패했어요. 다시 시도해주세요.');
    }
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
          <h1 className="text-3xl font-black tracking-tight text-foreground/90">반려동물 등록</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">우리 아이의 소중한 정보를 알려주세요</p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 아바타 업로드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-24 w-24 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="프로필 미리보기"
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border-4 border-dashed border-primary/20 text-4xl">
                    {getDefaultEmoji(speciesValue)}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-md">
                  <Camera className="h-3.5 w-3.5 text-white" />
                </div>
              </button>
              <p className="text-xs font-medium text-muted-foreground">프로필 사진 추가 (선택)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </motion.div>

            {/* 기본 정보 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* 제출 버튼 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                type="submit"
                disabled={createPet.isPending}
                className={cn(
                  'h-16 w-full rounded-2xl bg-primary text-lg font-bold text-white shadow-lg shadow-primary/20',
                  'hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] transition-all',
                  'disabled:opacity-60',
                )}
              >
                {createPet.isPending ? '등록 중…' : '아이 등록 완료하기'}
              </Button>

              {createPet.isError && (
                <p className="mt-4 text-center text-sm font-medium text-destructive">
                  등록에 실패했어요. 다시 시도해주세요.
                </p>
              )}
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  );
}
