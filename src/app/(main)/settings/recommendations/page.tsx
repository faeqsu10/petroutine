'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, MousePointerClick, Sparkles } from 'lucide-react';
import { useAdminAccess } from '@/hooks/use-admin-access';
import { useRecommendationAnalytics } from '@/hooks/use-recommendation-analytics';
import { BOTTOM_NAV_PADDING } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bento-item bg-card/60 glass p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
            {label}
          </p>
          <p className="text-2xl font-black tracking-tight text-foreground/90">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationSettingsPage() {
  const { data: adminAccess, isLoading: adminLoading } = useAdminAccess();
  const { data, isLoading, isError } = useRecommendationAnalytics();

  if (adminLoading) {
    return (
      <div className={`space-y-6 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-card/60" />
      </div>
    );
  }

  if (!adminAccess?.isAdmin) {
    return (
      <div className={`space-y-6 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Link>
        <div className="bento-item flex flex-col items-center gap-3 bg-card/60 glass py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">운영 로그는 관리자만 볼 수 있어요</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-card/60" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bento-item h-28 animate-pulse bg-card/60 glass" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`space-y-6 px-5 ${BOTTOM_NAV_PADDING} pt-10`}>
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Link>
        <div className="bento-item flex flex-col items-center gap-3 bg-card/60 glass py-12 text-center">
          <p className="text-sm font-medium text-destructive">추천 로그를 불러오지 못했어요</p>
          <Button variant="outline" className="rounded-2xl" onClick={() => window.location.reload()}>
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-8 px-5 ${BOTTOM_NAV_PADDING} pt-10`}
    >
      <div className="space-y-3">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Link>
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground/90">추천 로그</h1>
          <p className="text-sm text-muted-foreground">
            최근 추천 탭 반응을 기준으로 어떤 상품과 필터가 자주 쓰이는지 확인합니다.
          </p>
        </header>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="상세 열림" value={String(data.totalDetailOpens)} icon={<Eye className="h-5 w-5" />} />
        <SummaryCard label="CTA 클릭" value={String(data.totalCtaClicks)} icon={<MousePointerClick className="h-5 w-5" />} />
        <SummaryCard label="CTR" value={`${data.clickThroughRate}%`} icon={<Sparkles className="h-5 w-5" />} />
        <SummaryCard label="표본 수" value={String(data.sampleSize)} icon={<Sparkles className="h-5 w-5" />} />
      </div>

      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          상세 열림 Top 5
        </h2>
        <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
          {data.topOpenedProducts.length === 0 ? (
            <div className="p-4.5 text-sm text-muted-foreground">아직 상세 열림 로그가 없어요</div>
          ) : (
            data.topOpenedProducts.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4.5">
                <div>
                  <p className="font-bold text-foreground/80">{item.label}</p>
                  <p className="text-xs font-medium text-muted-foreground">{item.key}</p>
                </div>
                <span className="text-sm font-black text-primary">{item.count}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          CTA 클릭 Top 5
        </h2>
        <div className="bento-item divide-y divide-border/40 overflow-hidden bg-card/60 glass">
          {data.topClickedProducts.length === 0 ? (
            <div className="p-4.5 text-sm text-muted-foreground">아직 CTA 클릭 로그가 없어요</div>
          ) : (
            data.topClickedProducts.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4.5">
                <div>
                  <p className="font-bold text-foreground/80">{item.label}</p>
                  <p className="text-xs font-medium text-muted-foreground">{item.key}</p>
                </div>
                <span className="text-sm font-black text-primary">{item.count}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          필터 사용 현황
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bento-item bg-card/60 glass p-4.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">종 필터</p>
            <div className="mt-3 space-y-2">
              {data.bySpeciesFilter.length === 0 ? (
                <p className="text-sm text-muted-foreground">로그 없음</p>
              ) : (
                data.bySpeciesFilter.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground/80">{item.label}</span>
                    <span className="font-black text-primary">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bento-item bg-card/60 glass p-4.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">카테고리 필터</p>
            <div className="mt-3 space-y-2">
              {data.byCategoryFilter.length === 0 ? (
                <p className="text-sm text-muted-foreground">로그 없음</p>
              ) : (
                data.byCategoryFilter.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground/80">{item.label}</span>
                    <span className="font-black text-primary">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
