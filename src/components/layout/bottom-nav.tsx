'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Wallet, Settings, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/care', label: '케어', icon: Heart },
  { href: '/expenses', label: '가계부', icon: Wallet },
  { href: '/recommend', label: '추천', icon: ShoppingBag },
  { href: '/settings', label: '설정', icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
      <nav className="glass pointer-events-auto flex items-center gap-1 rounded-full px-2 py-2 shadow-2xl">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-full px-5 py-2.5 transition-all duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary/5 rounded-full"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <Icon className={cn('relative z-10 h-5 w-5', isActive && 'stroke-[2.5px]')} />
              <span className="relative z-10 mt-1 text-[10px] font-bold leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
