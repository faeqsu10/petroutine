'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Wallet, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/care', label: '케어', icon: Heart },
  { href: '/expenses', label: '가계부', icon: Wallet },
  { href: '/settings', label: '설정', icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
