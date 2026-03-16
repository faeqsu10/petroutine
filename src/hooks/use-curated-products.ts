'use client';

import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import type { CuratedProduct } from '@/lib/curated-products';

const CURATED_PRODUCTS_KEY = 'curated-products';

export function useCuratedProducts() {
  return useQuery({
    queryKey: [CURATED_PRODUCTS_KEY],
    queryFn: async (): Promise<CuratedProduct[]> => {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];

      const snapshot = await getDocs(
        query(collection(db, 'curatedProducts'), orderBy('sortOrder')),
      );

      return snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name as string,
            category: data.category as CuratedProduct['category'],
            species: data.species as CuratedProduct['species'],
            price: data.price as number,
            imageUrl: (data.imageUrl as string | null | undefined) ?? null,
            description: data.description as string,
            rating: data.rating as number,
            affiliateUrl: (data.affiliateUrl as string | null | undefined) ?? null,
            isActive: (data.isActive as boolean | undefined) ?? true,
            sortOrder: (data.sortOrder as number | undefined) ?? 999,
          } satisfies CuratedProduct;
        })
        .filter((product) => product.isActive);
    },
  });
}
