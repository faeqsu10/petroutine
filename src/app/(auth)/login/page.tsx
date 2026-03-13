'use client';

import { auth } from '@/lib/firebase/client';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error('세션 생성 실패');
      }

      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-indigo-600">Petroutine</h1>
        <p className="mt-3 text-gray-500">기억에 의존하지 않는 반려동물 관리</p>
      </div>

      <Card className="w-full max-w-sm border-0 bg-transparent shadow-none">
        <CardContent className="flex flex-col gap-3 p-0">
          {/* TODO: Kakao login — Firebase does not natively support Kakao OAuth.
              Requires custom token via Kakao SDK + Firebase Custom Auth.
              Keeping button disabled until implemented. */}
          <Button
            disabled
            className="h-12 rounded-xl bg-[#FEE500] font-medium text-[#191919] hover:bg-[#FDD800] active:scale-[0.98] disabled:opacity-50"
          >
            카카오로 시작하기 (준비 중)
          </Button>
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            className="h-12 rounded-xl font-medium active:scale-[0.98]"
          >
            Google로 시작하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
