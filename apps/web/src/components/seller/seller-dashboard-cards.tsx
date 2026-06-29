'use client';

import Link from 'next/link';

import { Card } from '@community-marketplace/ui-dashboard';
import { cn } from '@community-marketplace/ui';

import type { SellerDashboardStats } from '@/hooks/use-seller-dashboard-stats';
import { SELLER_ROUTES } from '@/lib/seller-routes';

const CARDS: Array<{
  key: keyof Pick<
    SellerDashboardStats,
    'activeListings' | 'totalSales' | 'totalEarnings' | 'unreadMessages'
  >;
  title: string;
  href: string;
  description: string;
}> = [
  {
    key: 'activeListings',
    title: 'Active listings',
    href: SELLER_ROUTES.listings,
    description: 'Live on marketplace',
  },
  {
    key: 'totalSales',
    title: 'Total sales',
    href: '/seller/sales',
    description: 'Completed sales',
  },
  {
    key: 'totalEarnings',
    title: 'Earnings',
    href: '/seller/earnings',
    description: 'Lifetime earnings',
  },
  {
    key: 'unreadMessages',
    title: 'Unread messages',
    href: '/seller/chat',
    description: 'Buyer conversations',
  },
];

interface SellerDashboardCardsProps {
  stats: SellerDashboardStats;
  loading?: boolean;
}

export function SellerDashboardCards({ stats, loading }: SellerDashboardCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-accent))] focus-visible:ring-offset-2"
        >
          <Card
            className={cn(
              'h-full transition-shadow group-hover:shadow-md',
              loading && 'pointer-events-none',
            )}
          >
            <p className="text-sm font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
              {card.title}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-[hsl(var(--dashboard-sidebar-border))]/60" />
              ) : (
                String(stats[card.key])
              )}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {card.description}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
