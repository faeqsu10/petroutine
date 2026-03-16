'use client';

import { useQuery } from '@tanstack/react-query';

const ADMIN_ACCESS_KEY = 'admin-access';

export function useAdminAccess() {
  return useQuery({
    queryKey: [ADMIN_ACCESS_KEY],
    queryFn: async (): Promise<{ isAdmin: boolean }> => {
      const response = await fetch('/api/admin/access', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load admin access');
      }

      return response.json() as Promise<{ isAdmin: boolean }>;
    },
  });
}
