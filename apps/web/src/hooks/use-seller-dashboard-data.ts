'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SellerStore, SellerVerificationStatus, UserProfile } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

import { NOTIFICATIONS_UPDATED_EVENT } from '@/lib/notification-unread-events';
import { chatService } from '@/services/chat.service';
import { sellerService } from '@/services/marketplace.service';
import { notificationsService } from '@/services/notifications.service';
import { paymentsService } from '@/services/payments.service';
import { sellerVerificationService } from '@/services/seller-verification.service';

import type { SellerListingsSummary } from './use-seller-profile-data';
import type { SellerDashboardStats } from './use-seller-dashboard-stats';

export interface SellerDashboardData {
  profile: UserProfile | null;
  verification: SellerVerificationStatus | null;
  stores: SellerStore[];
  listingsSummary: SellerListingsSummary;
  stats: SellerDashboardStats;
}

const EMPTY_SUMMARY: SellerListingsSummary = {
  active: 0,
  sold: 0,
  draft: 0,
  total: 0,
  totalViews: 0,
};

const EMPTY_STATS: SellerDashboardStats = {
  activeListings: 0,
  totalSales: 0,
  totalEarnings: formatCurrency(0),
  unreadMessages: 0,
  unreadNotifications: 0,
  totalViews: 0,
};

export function useSellerDashboardData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<SellerDashboardData>({
    profile: null,
    verification: null,
    stores: [],
    listingsSummary: EMPTY_SUMMARY,
    stats: EMPTY_STATS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setData({
        profile: null,
        verification: null,
        stores: [],
        listingsSummary: EMPTY_SUMMARY,
        stats: EMPTY_STATS,
      });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [
        profile,
        verification,
        storesOverview,
        analyticsRes,
        draftRes,
        earnings,
        unreadNotifications,
        inbox,
      ] = await Promise.all([
        sellerService.getProfile(),
        sellerVerificationService.getStatus(),
        sellerService.getStoresOverview().catch(() => null),
        sellerService.getAnalyticsSummary().catch(() => null),
        sellerService.getListings(1, 1, 'draft').catch(() => null),
        paymentsService.getEarningsSummary().catch(() => null),
        notificationsService.getUnreadCount('SELLER').catch(() => 0),
        chatService.getInbox(1, 50).catch(() => null),
      ]);

      const analytics = analyticsRes?.data as
        | { activeCount?: number; soldCount?: number; totalViews?: number }
        | undefined;

      const active = analytics?.activeCount ?? 0;
      const sold = analytics?.soldCount ?? 0;
      const draft = draftRes?.meta?.total ?? 0;
      const totalViews = analytics?.totalViews ?? 0;

      const stores = storesOverview?.stores ?? [];

      const inboxItems = Array.isArray(inbox?.data) ? inbox.data : [];
      const unreadMessages = inboxItems.reduce(
        (sum, item) => sum + (item.unreadCount ?? 0),
        0,
      );

      setData({
        profile,
        verification,
        stores,
        listingsSummary: {
          active,
          sold,
          draft,
          total: active + sold + draft,
          totalViews,
        },
        stats: {
          activeListings: active,
          totalSales: sold,
          totalEarnings: formatCurrency(earnings?.totalEarnings ?? 0, earnings?.currency ?? 'EUR'),
          unreadMessages,
          unreadNotifications,
          totalViews,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function handleNotificationsUpdated() {
      void load();
    }
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    };
  }, [load]);

  return { ...data, loading, error, reload: load };
}
