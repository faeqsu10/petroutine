'use client';

import { auth, db } from '@/lib/firebase/client';
import { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithRedirect, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

async function createSession(idToken: string) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('세션 생성 실패');
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let handled = false;
    let unsubscribe = () => {};

    const upsertUserDoc = async (user: User) => {
      const now = new Date().toISOString();
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          avatarUrl: user.photoURL,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now,
        });
      } else {
        await setDoc(userRef, {
          displayName: user.displayName ?? '',
          avatarUrl: user.photoURL,
          updatedAt: now,
          lastActiveAt: now,
        }, { merge: true });
      }
    };

    const completeLogin = async (user: User) => {
      if (!isActive || handled) return;

      handled = true;
      try {
        const idToken = await user.getIdToken();
        await createSession(idToken);
        await upsertUserDoc(user);
        if (!isActive) return;
        router.replace('/');
      } catch (e) {
        handled = false;
        console.error('Session error:', e);
        if (isActive) setIsLoading(false);
      }
    };

    const initAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await completeLogin(result.user);
          return;
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await completeLogin(user);
          return;
        }

        if (isActive) setIsLoading(false);
      });
    };

    void initAuth();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [router]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setIsLoading(true);

    try {
      // Redirect 기반 인증으로 COOP/팝업 창 간 참조 이슈를 피한다.
      await signInWithRedirect(auth, provider);
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background overflow-hidden px-6">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[55%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, oklch(0.68 0.16 35 / 0.14) 0%, transparent 68%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, oklch(0.68 0.16 35 / 0.04) 0%, transparent 100%)',
        }}
      />

      {isLoading ? (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">로그인 처리 중…</p>
        </div>
      ) : (
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <Image
            src="/logo-horizontal.svg"
            alt="Petroutine"
            width={192}
            height={48}
            priority
            className="drop-shadow-sm"
          />
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full flex flex-col gap-3"
        >
          <Button
            onClick={handleGoogleLogin}
            className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Google로 시작하기
          </Button>
          <Button
            disabled
            className="h-14 w-full rounded-2xl bg-[#FEE500] text-base font-bold text-[#191919] hover:bg-[#FDD800] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            카카오로 시작하기 (준비 중)
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-xs text-muted-foreground text-center"
        >
          Google 계정으로 간편하게 시작할 수 있어요
        </motion.p>
      </div>
      )}
    </div>
  );
}
