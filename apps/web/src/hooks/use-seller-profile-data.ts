'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SellerVerificationStatus, UserProfile } from '@community-marketplace/types';

import { sellerService } from '@/services/marketplace.service';
import { sellerVerificationService } from '@/services/seller-verification.service';

export interface SellerListingsSummary {
  active: number;
  sold: number;
  draft: number;
  total: number;
  totalViews: number;
}

export interface SellerProfileData {
  profile: UserProfile | null;
  verification: SellerVerificationStatus | null;
  listingsSummary: SellerListingsSummary;
}

const EMPTY_SUMMARY: SellerListingsSummary = {
  active: 0,
  sold: 0,
  draft: 0,
  total: 0,
  totalViews: 0,
};

export function useSellerProfileData() {
  const [data, setData] = useState<SellerProfileData>({
    profile: null,
    verification: null,
    listingsSummary: EMPTY_SUMMARY,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, verification, analyticsRes, draftRes] = await Promise.all([
        sellerService.getProfile(),
        sellerVerificationService.getStatus(),
        sellerService.getAnalyticsSummary().catch(() => null),
        sellerService.getListings(1, 1, 'draft').catch(() => null),
      ]);

      const analytics = analyticsRes?.data as
        | { activeCount?: number; soldCount?: number; totalViews?: number }
        | undefined;

      const active = analytics?.activeCount ?? 0;
      const sold = analytics?.soldCount ?? 0;
      const draft = draftRes?.meta?.total ?? 0;

      setData({
        profile,
        verification,
        listingsSummary: {
          active,
          sold,
          draft,
          total: active + sold + draft,
          totalViews: analytics?.totalViews ?? 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, loading, error, reload: load };
}
