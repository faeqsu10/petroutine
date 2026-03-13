'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
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
        <h1 className="text-4xl font-bold text-indigo-600">Petroutine</h1>
        <p className="mt-3 text-gray-500">기억에 의존하지 않는 반려동물 관리</p>
      </div>

      <Card className="w-full max-w-sm border-0 bg-transparent shadow-none">
        <CardContent className="flex flex-col gap-3 p-0">
          <Button
            onClick={() => handleSocialLogin('kakao')}
            className="h-12 rounded-xl bg-[#FEE500] font-medium text-[#191919] hover:bg-[#FDD800] active:scale-[0.98]"
          >
            카카오로 시작하기
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            className="h-12 rounded-xl font-medium active:scale-[0.98]"
          >
            Google로 시작하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
