'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Bell, Wallet, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: <Bell className="w-5 h-5 text-primary" />,
    title: '알림 한 번이면 끝',
    description: '목욕, 심장사상충, 발톱 — 알림 받고 버튼 하나면 다음 일정이 자동으로 잡혀요.',
    color: 'bg-primary/8',
  },
  {
    icon: <Wallet className="w-5 h-5 text-primary" />,
    title: '지출도 한눈에',
    description: '병원비, 사료, 미용비까지 아이별로 얼마나 쓰는지 파악할 수 있어요.',
    color: 'bg-primary/10',
  },
  {
    icon: <Users className="w-5 h-5 text-rose-500" />,
    title: '여러 아이도 OK',
    description: '고양이 둘, 강아지 하나 — 각자 다른 루틴도 한 앱에서 관리해요.',
    color: 'bg-rose-50',
  },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background overflow-hidden">
      {/* 배경 그라데이션 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[45%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, oklch(0.68 0.16 35 / 0.12) 0%, transparent 70%)',
        }}
      />

      {/* 히어로 */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-6 max-w-sm mx-auto"
        >
          {/* 로고 */}
          <Image
            src="/logo-horizontal.svg"
            alt="Petroutine"
            width={180}
            height={45}
            priority
            className="drop-shadow-sm"
          />

          {/* 핵심 메시지 */}
          <div className="space-y-2">
            <h1 className="text-[2rem] font-black tracking-tight leading-[1.2] text-foreground">
              기억에 의존하지 않는
              <br />
              <span className="text-primary">반려동물 관리</span>
            </h1>
            <p className="text-[0.9rem] text-muted-foreground leading-relaxed">
              &ldquo;목욕이 언제였더라?&rdquo; — 이제 그런 걱정 없어요.
              <br />
              루틴을 설정하면 나머지는 앱이 챙겨드려요.
            </p>
          </div>
        </motion.div>
      </section>

      {/* 기능 카드 */}
      <section className="relative px-5 pb-52">
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + index * 0.08,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="bento-item p-4 flex items-start gap-4"
            >
              <div
                className={`shrink-0 p-2.5 rounded-xl ${feature.color} mt-0.5`}
              >
                {feature.icon}
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-sm text-foreground">{feature.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA — 화면 하단 고정 */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-8 bg-gradient-to-t from-background via-background/96 to-transparent z-50"
      >
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          <Link href="/login" className="w-full">
            <Button className="w-full h-14 rounded-2xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all">
              시작하기
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Google 계정으로 간편하게 시작할 수 있어요
          </p>
        </div>
      </motion.section>
    </div>
  );
}
