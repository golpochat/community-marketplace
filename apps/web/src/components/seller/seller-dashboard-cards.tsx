'use client';

import Link from 'next/link';

import { DashboardCard } from '@community-marketplace/ui-dashboard';

import type { SellerDashboardStats } from '@/hooks/use-seller-dashboard-stats';

const CARDS: Array<{
  key: keyof SellerDashboardStats;
  title: string;
  href: string;
  description: string;
}> = [
  { key: 'activeListings', title: 'Active listings', href: '/seller/listings', description: 'Live on marketplace' },
  { key: 'totalSales', title: 'Total sales', href: '/seller/sales', description: 'Completed sales' },
  { key: 'totalEarnings', title: 'Earnings', href: '/seller/earnings', description: 'Lifetime earnings' },
  { key: 'unreadMessages', title: 'Unread messages', href: '/seller/chat', description: 'Buyer conversations' },
];

interface SellerDashboardCardsProps {
  stats: SellerDashboardStats;
  loading?: boolean;
}

export function SellerDashboardCards({ stats, loading }: SellerDashboardCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => (
        <Link key={card.href} href={card.href} className="block">
          <DashboardCard className="transition-shadow hover:shadow-md">
            <p className="text-sm font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
              {card.title}
            </p>
            <p className="mt-2 text-2xl font-bold text-[hsl(var(--dashboard-main-fg))]">
              {loading ? '…' : String(stats[card.key])}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {card.description}
            </p>
          </DashboardCard>
        </Link>
      ))}
    </div>
  );
}
