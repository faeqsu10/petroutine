'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, setDoc } from 'firebase/firestore';
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

  const updateLastActive = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { lastActiveAt: new Date().toISOString() }, { merge: true });
    } catch {
      // 세션 갱신 실패는 무시 — UX에 영향 없음
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!authReady) setAuthReady(true);
      queryClient.invalidateQueries();
      if (user) void updateLastActive(user);
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
