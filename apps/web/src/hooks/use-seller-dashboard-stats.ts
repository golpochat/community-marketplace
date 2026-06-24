'use client';

import { useEffect, useState } from 'react';

import { formatCurrency } from '@community-marketplace/utils';

import { chatService } from '@/services/chat.service';
import { notificationsService } from '@/services/notifications.service';
import { paymentsService } from '@/services/payments.service';
import { sellerService } from '@/services/marketplace.service';

export interface SellerDashboardStats {
  activeListings: number;
  totalSales: number;
  totalEarnings: string;
  unreadMessages: number;
  unreadNotifications: number;
  totalViews: number;
}

const DEFAULT_STATS: SellerDashboardStats = {
  activeListings: 0,
  totalSales: 0,
  totalEarnings: formatCurrency(0),
  unreadMessages: 0,
  unreadNotifications: 0,
  totalViews: 0,
};

export function useSellerDashboardStats() {
  const [stats, setStats] = useState<SellerDashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [analyticsRes, earnings, notifications, inbox] = await Promise.all([
          sellerService.getAnalyticsSummary().catch(() => null),
          paymentsService.getEarningsSummary().catch(() => null),
          notificationsService.listSeller(1, 1).catch(() => null),
          chatService.getInbox(1, 50).catch(() => null),
        ]);

        if (cancelled) return;

        const analytics = analyticsRes?.data as
          | { activeCount?: number; soldCount?: number; totalViews?: number }
          | undefined;

        const inboxItems = Array.isArray(inbox?.data) ? inbox.data : [];
        const unreadMessages = inboxItems.reduce(
          (sum, item) => sum + (item.unreadCount ?? 0),
          0,
        );

        setStats({
          activeListings: analytics?.activeCount ?? 0,
          totalSales: analytics?.soldCount ?? 0,
          totalEarnings: formatCurrency(earnings?.totalEarnings ?? 0, earnings?.currency ?? 'EUR'),
          unreadMessages,
          unreadNotifications: notifications?.unreadCount ?? 0,
          totalViews: analytics?.totalViews ?? 0,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading };
}
