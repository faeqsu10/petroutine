import { BottomNav } from '@/components/layout/bottom-nav';
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <main className="mx-auto max-w-lg">{children}</main>
      <BottomNav />
    </div>
  );
}
