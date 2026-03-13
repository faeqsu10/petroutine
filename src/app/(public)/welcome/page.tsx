'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: '🔔',
    title: '알림 한 번이면 끝',
    description: '완료 버튼 1번으로 다음 일정이 자동 생성돼요',
  },
  {
    icon: '📊',
    title: '지출도 한눈에',
    description: '반려동물별 월간 지출을 카테고리별로 관리해요',
  },
  {
    icon: '🐾',
    title: '여러 아이도 OK',
    description: '반려동물마다 케어 주기를 따로 설정할 수 있어요',
  },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* 히어로 */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pt-16 text-center">
        <Image
          src="/logo.svg"
          alt="Petroutine"
          width={72}
          height={72}
          priority
        />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
          기억에 의존하지 않는
          <br />
          <span className="text-indigo-600">반려동물 관리</span>
        </h1>
        <p className="mt-4 max-w-xs text-base text-gray-500">
          목욕, 예방접종, 미용… 까먹지 마세요.
          <br />
          Petroutine이 알아서 챙겨드려요.
        </p>
      </section>

      {/* 기능 소개 */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-sm space-y-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm"
            >
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <p className="font-semibold text-gray-800">{feature.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="sticky bottom-0 border-t border-gray-100 bg-white/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-sm">
          <Link href="/login">
            <Button className="w-full rounded-2xl bg-indigo-600 py-6 text-base font-semibold text-white hover:bg-indigo-700 active:scale-[0.98]">
              시작하기
            </Button>
          </Link>
          <p className="mt-3 text-center text-xs text-gray-400">
            Google 계정으로 간편하게 시작할 수 있어요
          </p>
        </div>
      </section>
    </div>
  );
}
