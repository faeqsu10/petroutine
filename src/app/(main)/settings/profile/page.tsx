'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { usePets } from '@/hooks/use-pets';
import { useCareItems } from '@/hooks/use-care-items';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, User as UserIcon, Calendar, PawPrint, ClipboardList } from 'lucide-react';
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

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '알 수 없음';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { data: pets } = usePets();
  const { data: careItems } = useCareItems(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}
    >
      {/* 헤더 */}
      <motion.header variants={item} className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all hover:bg-secondary/80 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-black tracking-tight text-foreground/90">프로필</h1>
      </motion.header>

      {/* 프로필 사진 + 이름 + 이메일 */}
      <motion.div variants={item} className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 shadow-inner shadow-primary/5 overflow-hidden">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName ?? '프로필 사진'}
              width={96}
              height={96}
              className="h-24 w-24 rounded-3xl object-cover"
            />
          ) : (
            <UserIcon className="h-10 w-10 text-primary/50" />
          )}
        </div>
        <div className="text-center">
          <p className="text-xl font-black tracking-tight text-foreground/90">
            {user?.displayName ?? '사용자'}
          </p>
          <p className="text-sm font-medium text-muted-foreground">{user?.email ?? ''}</p>
        </div>
      </motion.div>

      {/* 계정 정보 */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          계정 정보
        </h2>
        <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
          <div className="flex items-center gap-4 p-4.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground shrink-0">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">표시 이름</p>
              <p className="font-bold text-foreground/80 truncate">
                {user?.displayName ?? '설정되지 않음'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">계정 생성일</p>
              <p className="font-bold text-foreground/80">
                {formatDate(user?.metadata.creationTime)}
              </p>
            </div>
          </div>
        </div>
        <p className="px-1 text-xs font-medium text-muted-foreground/60">
          Google 계정에서 관리됩니다. 이름·이메일 변경은 Google 계정 설정에서 하세요.
        </p>
      </motion.section>

      {/* 활동 요약 */}
      <motion.section variants={item} className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          활동 요약
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bento-item flex flex-col items-center gap-2 p-5 bg-card/60 glass">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <PawPrint className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground/90">{pets?.length ?? 0}</p>
            <p className="text-xs font-bold text-muted-foreground">등록된 반려동물</p>
          </div>
          <div className="bento-item flex flex-col items-center gap-2 p-5 bg-card/60 glass">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground/90">{careItems?.length ?? 0}</p>
            <p className="text-xs font-bold text-muted-foreground">등록된 케어 항목</p>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
