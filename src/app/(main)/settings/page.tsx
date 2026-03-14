'use client';

import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { usePets } from '@/hooks/use-pets';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Bell, User, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BOTTOM_NAV_PADDING } from '@/lib/constants';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const router = useRouter();
  const { data: pets, isError: petsError } = usePets();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {
      // 실패해도 로그인 페이지로 이동
    }
    router.push('/login');
  };

  if (petsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-5">
        <p className="text-sm font-medium text-destructive">데이터를 불러오지 못했어요</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-bold text-primary"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground/90">설정</h1>
        <p className="text-sm text-muted-foreground">앱 환경 및 반려동물을 관리하세요</p>
      </header>

      {/* 반려동물 관리 */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          반려동물
        </h2>
        <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
          {pets?.map((pet) => (
            <Link
              key={pet.id}
              href={`/pets/${pet.id}/edit`}
              className="flex items-center justify-between p-4.5 transition-all hover:bg-primary/5 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl shadow-inner shadow-primary/5 overflow-hidden">
                  {pet.avatarUrl ? (
                    <Image
                      src={pet.avatarUrl}
                      alt={pet.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-2xl object-cover"
                    />
                  ) : (
                    pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground/80">{pet.name}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {pet.species === 'dog' ? '강아지' : pet.species === 'cat' ? '고양이' : '기타'}
                    {pet.breed ? ` · ${pet.breed}` : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </Link>
          ))}
          <Link
            href="/pets/add"
            className="group flex items-center gap-4 p-4.5 text-primary transition-all hover:bg-primary/5 active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 transition-colors group-hover:bg-primary/5">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">우리 아이 추가하기</span>
          </Link>
        </div>
      </motion.section>

      {/* 앱 설정 */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          환경 설정
        </h2>
        <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
          <div className="flex items-center justify-between p-4.5 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-foreground/80">알림 설정</p>
                <p className="text-xs font-medium text-muted-foreground">케어 리마인더, 서비스 소식</p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground/60">(준비 중)</span>
          </div>
        </div>
      </motion.section>

      {/* 계정 */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          계정 관리
        </h2>
        <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
          <div className="flex items-center justify-between p-4.5 opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-foreground/80">프로필 편집</p>
                <p className="text-xs font-medium text-muted-foreground">계정 연동 및 정보 수정</p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground/60">(준비 중)</span>
          </div>
        </div>
      </motion.section>

      <Separator className="bg-border/40" />

      <motion.div variants={item}>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="h-14 w-full rounded-2xl border-destructive/20 text-destructive shadow-sm hover:bg-destructive/5 hover:text-destructive active:scale-[0.98] transition-all"
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </motion.div>

      <motion.div variants={item} className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Petroutine v0.1.0
        </p>
      </motion.div>
    </motion.div>
  );
}
