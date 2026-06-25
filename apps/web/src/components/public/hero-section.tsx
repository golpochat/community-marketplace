'use client';

import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';
import { BadgeCheck, MessageSquare, Shield, Truck } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { getUserNavLinks } from '@/lib/user-nav-routes';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

const TRUST_BADGES = [
  { icon: Shield, label: 'No commission fees' },
  { icon: BadgeCheck, label: 'Verified sellers' },
  { icon: MessageSquare, label: 'Secure messaging' },
  { icon: Truck, label: 'Local delivery options' },
] as const;

export function HeroSection() {
  const { user, isAuthenticated, dashboardPath } = useAuth();
  const hasAuthState = isAuthenticated || !!user;
  const sellHref =
    user && dashboardPath
      ? getUserNavLinks(user.role, dashboardPath).sellItem
      : '/seller/listings/create';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-[hsl(var(--brand-neutral))] to-primary/5">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-0 h-64 w-64 rounded-full bg-[hsl(var(--brand-secondary)/0.15)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl text-left">
          <h1 className="text-h1 text-gray-900 sm:text-[40px] lg:text-[48px]">
            Buy &amp; sell in your community
          </h1>
          <p className="mt-4 text-body text-gray-600">
            Discover local listings across Ireland starting from {formatCurrency(0)} — connect with
            trusted neighbours and verified sellers near you.
          </p>

          <ul className="mt-6 flex flex-wrap gap-3">
            {TRUST_BADGES.map((badge) => (
              <li
                key={badge.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-small text-gray-700 shadow-brand-sm"
              >
                <badge.icon className="h-4 w-4 text-primary" aria-hidden />
                {badge.label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={WEB_APP_ROUTES.listings}>
              <Button size="lg" className="w-full sm:w-auto">
                Browse Listings
              </Button>
            </Link>
            {hasAuthState ? (
              <Link href={sellHref}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sell an Item
                </Button>
              </Link>
            ) : (
              <Link href={WEB_APP_ROUTES.register}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Join Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
