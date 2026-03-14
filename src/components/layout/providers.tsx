'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useState, useEffect, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 세션 쿠키가 없으면 자동 생성 (리다이렉트 로그인, 새로고침 등 모든 상황 대응)
        const hasSession = document.cookie.includes('__session');
        if (!hasSession) {
          try {
            const idToken = await user.getIdToken();
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
          } catch (e) {
            console.error('Session creation failed:', e);
          }
        }
      }
      if (!authReady) setAuthReady(true);
      queryClient.invalidateQueries();
    });
    return unsubscribe;
  }, [queryClient, authReady]);

  return (
    <QueryClientProvider client={queryClient}>
      {authReady ? children : (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      )}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
