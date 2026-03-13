'use client';

import { Button } from '@/components/ui/button';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-4xl">😵</p>
      <h2 className="text-lg font-bold text-gray-800">문제가 발생했어요</h2>
      <p className="text-sm text-gray-500">잠시 후 다시 시도해주세요</p>
      <Button
        onClick={reset}
        className="mt-2 rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700"
      >
        다시 시도
      </Button>
    </div>
  );
}
