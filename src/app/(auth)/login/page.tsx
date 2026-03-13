'use client';

import { auth } from '@/lib/firebase/client';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background overflow-hidden px-6">
      {/* 배경 그라데이션 — 웰컴 페이지와 동일한 코랄 피치 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[55%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, oklch(0.68 0.16 35 / 0.14) 0%, transparent 68%)',
        }}
      />
      {/* 하단 부드러운 그라데이션 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, oklch(0.68 0.16 35 / 0.04) 0%, transparent 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10">
        {/* 로고 + 헤드카피 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-5 text-center"
        >
          {/* 시각적 로고 */}
          <Image
            src="/logo-horizontal.svg"
            alt="Petroutine"
            width={192}
            height={48}
            priority
            className="drop-shadow-sm"
          />
          {/* 접근성 + 테스트용 h1 (시각적으로는 숨김) */}
          <h1 className="sr-only">Petroutine</h1>

          <div className="space-y-1.5">
            <p className="text-[1.35rem] font-black tracking-tight leading-snug text-foreground">
              기억에 의존하지 않는 반려동물 관리
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              루틴을 설정하면 나머지는 앱이 챙겨드려요
            </p>
          </div>
        </motion.div>

        {/* 로그인 버튼 그룹 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full flex flex-col gap-3"
        >
          {/* Google 로그인 */}
          <Button
            onClick={handleGoogleLogin}
            className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Google로 시작하기
          </Button>

          {/* 카카오 로그인 — 준비 중 */}
          {/* TODO: Kakao login — Firebase does not natively support Kakao OAuth.
              Requires custom token via Kakao SDK + Firebase Custom Auth.
              Keeping button disabled until implemented. */}
          <Button
            disabled
            className="h-14 w-full rounded-2xl bg-[#FEE500] text-base font-bold text-[#191919] hover:bg-[#FDD800] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            카카오로 시작하기 (준비 중)
          </Button>
        </motion.div>

        {/* 안내 문구 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-xs text-muted-foreground text-center"
        >
          Google 계정으로 간편하게 시작할 수 있어요
        </motion.p>
      </div>
    </div>
  );
}
