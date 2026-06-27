'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { buyerService } from '@/services/marketplace.service';

export function useListingFavorite(listingId: string) {
  const { isAuthenticated, user } = useAuth();
  const [initialSaved, setInitialSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'BUYER') {
      setInitialSaved(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    buyerService
      .isFavorite(listingId)
      .then((saved) => {
        if (!cancelled) setInitialSaved(saved);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listingId, isAuthenticated, user?.role]);

  return { initialSaved, loading };
}
