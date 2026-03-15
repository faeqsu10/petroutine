'use client';

import { auth, db } from '@/lib/firebase/client';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';

const signupSchema = z
  .object({
    displayName: z.string().min(1, '이름을 입력해주세요'),
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

async function createSession(idToken: string) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('세션 생성 실패');
}

async function upsertUserDoc(user: User) {
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
}

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse({ displayName, email, password, passwordConfirm });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      const idToken = await credential.user.getIdToken();
      await createSession(idToken);
      await upsertUserDoc(credential.user);
      router.replace('/');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const code = (error as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        toast.error('이미 사용 중인 이메일입니다.');
      } else {
        toast.error('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
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

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Image
            src="/logo-horizontal.svg"
            alt="Petroutine"
            width={160}
            height={40}
            priority
            className="drop-shadow-sm"
          />
          <h1 className="text-xl font-black tracking-tight text-foreground">회원가입</h1>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          onSubmit={handleSignup}
          className="w-full flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름"
              required
              aria-label="이름"
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.displayName && (
              <p className="text-xs text-destructive px-1">{errors.displayName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              required
              aria-label="이메일"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.email && (
              <p className="text-xs text-destructive px-1">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)"
              required
              aria-label="비밀번호"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.password && (
              <p className="text-xs text-destructive px-1">{errors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              required
              aria-label="비밀번호 확인"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.passwordConfirm && (
              <p className="text-xs text-destructive px-1">{errors.passwordConfirm}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all mt-1"
          >
            {isLoading ? '가입 중…' : '회원가입'}
          </Button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-xs text-muted-foreground text-center"
        >
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            로그인
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
