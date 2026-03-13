'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="space-y-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold text-gray-800">설정</h1>

      <div className="space-y-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-800">알림 설정</h3>
          <p className="text-sm text-gray-400">준비 중...</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-800">반려동물 관리</h3>
          <p className="text-sm text-gray-400">준비 중...</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-medium text-gray-800">계정 정보</h3>
          <p className="text-sm text-gray-400">준비 중...</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
      >
        로그아웃
      </button>
    </div>
  );
}
