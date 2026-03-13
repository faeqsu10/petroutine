'use client';

import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { usePets } from '@/hooks/use-pets';
import Link from 'next/link';
import { ChevronRight, Bell, PawPrint, User, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const router = useRouter();
  const { data: pets } = usePets();

  const handleLogout = async () => {
    await signOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  };

  return (
    <div className="space-y-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold text-gray-800">설정</h1>

      {/* 반려동물 관리 */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">반려동물</h2>
        <Card className="divide-y divide-gray-100 overflow-hidden">
          {pets?.map((pet) => (
            <div
              key={pet.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg">
                  {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{pet.name}</p>
                  <p className="text-xs text-gray-400">
                    {pet.species === 'dog' ? '강아지' : pet.species === 'cat' ? '고양이' : '기타'}
                    {pet.breed ? ` · ${pet.breed}` : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          ))}
          <Link
            href="/pets/add"
            className="flex items-center gap-3 p-4 text-indigo-600 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-indigo-300">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">반려동물 추가</span>
          </Link>
        </Card>
      </section>

      {/* 앱 설정 */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">앱 설정</h2>
        <Card className="divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-800">알림 설정</p>
                <p className="text-xs text-gray-400">케어 알림, 방해금지 시간</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </Card>
      </section>

      {/* 계정 */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">계정</h2>
        <Card className="divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-800">계정 정보</p>
                <p className="text-xs text-gray-400">프로필, 이메일</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </Card>
      </section>

      <Separator />

      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="mr-2 h-4 w-4" />
        로그아웃
      </Button>

      <p className="text-center text-xs text-gray-300">Petroutine v0.1.0</p>
    </div>
  );
}
