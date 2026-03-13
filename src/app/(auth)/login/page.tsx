'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error('Login error:', error.message);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-indigo-600">🐾 Petroutine</h1>
        <p className="mt-3 text-gray-500">기억에 의존하지 않는 반려동물 관리</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={() => handleSocialLogin('kakao')}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3.5 font-medium text-[#191919] transition-transform active:scale-[0.98]"
        >
          카카오로 시작하기
        </button>
        <button
          onClick={() => handleSocialLogin('google')}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3.5 font-medium text-gray-700 transition-transform active:scale-[0.98]"
        >
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}
