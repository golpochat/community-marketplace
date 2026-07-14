'use client';

import Link from 'next/link';

import { DashboardCard } from '@community-marketplace/ui-dashboard';

import type { BuyerDashboardStats } from '@/hooks/use-buyer-dashboard-stats';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

const CARDS: Array<{
  key: keyof BuyerDashboardStats;
  title: string;
  href: string;
  description: string;
}> = [
  { key: 'favorites', title: 'Saved listings', href: WEB_APP_ROUTES.accountSaved, description: 'Your favorites' },
  { key: 'activeChats', title: 'Active chats', href: WEB_APP_ROUTES.accountMessages, description: 'Conversations' },
  { key: 'purchases', title: 'Purchases', href: WEB_APP_ROUTES.accountPurchases, description: 'Order history' },
  { key: 'unreadNotifications', title: 'Notifications', href: WEB_APP_ROUTES.accountNotifications, description: 'Unread updates' },
];

interface BuyerDashboardCardsProps {
  stats: BuyerDashboardStats;
  loading?: boolean;
}

export function BuyerDashboardCards({ stats, loading }: BuyerDashboardCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => (
        <Link key={card.href} href={card.href} className="block">
          <DashboardCard className="transition-shadow duration-150 hover:shadow-md">
            <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{card.title}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
              {loading ? '…' : String(stats[card.key])}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{card.description}</p>
          </DashboardCard>
        </Link>
      ))}
    </div>
  );
}
