'use client';

import { useEffect, useState } from 'react';

import { chatService } from '@/services/chat.service';
import { buyerService } from '@/services/marketplace.service';
import { notificationsService } from '@/services/notifications.service';
import { paymentsService } from '@/services/payments.service';

export interface BuyerDashboardStats {
  favorites: number;
  activeChats: number;
  purchases: number;
  unreadNotifications: number;
  unreadMessages: number;
}

const DEFAULT_STATS: BuyerDashboardStats = {
  favorites: 0,
  activeChats: 0,
  purchases: 0,
  unreadNotifications: 0,
  unreadMessages: 0,
};

export function useBuyerDashboardStats() {
  const [stats, setStats] = useState<BuyerDashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [favoritesRes, paymentsRes, notifications, inbox] = await Promise.all([
          buyerService.getFavorites(1, 1).catch(() => null),
          paymentsService.getBuyerHistory(1, 1).catch(() => null),
          notificationsService.listBuyer(1, 1).catch(() => null),
          chatService.getInbox(1, 50).catch(() => null),
        ]);

        if (cancelled) return;

        const favoritesTotal = favoritesRes?.meta?.total ?? 0;

        const inboxItems = Array.isArray(inbox?.data) ? inbox.data : [];
        const unreadMessages = inboxItems.reduce(
          (sum, item) => sum + (item.unreadCount ?? 0),
          0,
        );

        setStats({
          favorites: favoritesTotal,
          activeChats: inboxItems.length,
          purchases: paymentsRes?.meta?.total ?? (Array.isArray(paymentsRes?.data) ? paymentsRes.data.length : 0),
          unreadNotifications: notifications?.unreadCount ?? 0,
          unreadMessages,
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
