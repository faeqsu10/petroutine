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

const PRESET_COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];
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
      color: '#6366F1',
      notifyEnabled: true,
    },
  });

  function onSubmit(values: FormValues) {
    if (!activePetId) {
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
      },
    );
  }

  return (
    <div className="min-h-dvh px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">케어 항목 추가</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 항목 이름 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">항목 이름</FormLabel>
                <FormControl>
                  <Input
                    placeholder="예: 목욕, 심장사상충 약"
                    className="rounded-xl"
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
                <FormLabel className="text-sm font-semibold text-gray-700">카테고리</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
          <div className="grid gap-2">
            <Label className="text-sm font-semibold text-gray-700">주기</Label>
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="cycleValue"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        className="rounded-xl"
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
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CYCLE_UNIT_LABELS).map(([value, label]) => (
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
            </div>
          </div>

          {/* 아이콘 */}
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">아이콘</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => field.onChange(emoji)}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all',
                        field.value === emoji
                          ? 'bg-indigo-100 ring-2 ring-indigo-600'
                          : 'bg-gray-100',
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
                <FormLabel className="text-sm font-semibold text-gray-700">색상</FormLabel>
                <div className="flex gap-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={cn(
                        'h-9 w-9 rounded-full transition-all',
                        field.value === color && 'ring-2 ring-offset-2',
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
                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-medium text-gray-800">알림</p>
                    <p className="text-sm text-gray-500">케어 예정일에 알림을 받아요</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      field.value ? 'bg-indigo-600' : 'bg-gray-300',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                        field.value ? 'left-5 translate-x-0' : 'left-0.5',
                      )}
                    />
                  </button>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 py-6 text-base font-semibold text-white hover:bg-indigo-700 active:scale-95"
          >
            {isPending ? '저장 중...' : '저장하기'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
