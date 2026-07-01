'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button, cn } from '@community-marketplace/ui';
import { BadgeCheck, MapPin, MessageSquare, Shield } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { getUserNavLinks } from '@/lib/user-nav-routes';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

const TRUST_BADGES = [
  { icon: Shield, label: 'No commission fees' },
  { icon: BadgeCheck, label: 'Verified sellers' },
  { icon: MessageSquare, label: 'Secure messaging' },
  { icon: MapPin, label: 'Hyper-local discovery' },
] as const;

export function HeroSection() {
  const { user, isAuthenticated, dashboardPath } = useAuth();
  const hasAuthState = isAuthenticated || !!user;
  const sellHref =
    user && dashboardPath
      ? getUserNavLinks(user.role, dashboardPath).sellItem
      : '/seller/listings/create';

  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,hsl(var(--brand-primary)/0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--brand-accent)/0.12)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:py-20">
        <div className="max-w-xl text-left">
          <p className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Ireland&apos;s community marketplace
          </p>
          <h1 className="text-display mt-5 text-foreground">
            Buy and sell with people{' '}
            <span className="text-primary">nearby</span> you trust
          </h1>
          <p className="text-body-lg mt-5 max-w-lg">
            Discover local listings, message sellers safely, and keep trade in your neighbourhood —
            without platform commission fees.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {TRUST_BADGES.map((badge) => (
              <li
                key={badge.label}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-brand-sm"
              >
                <badge.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {badge.label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={WEB_APP_ROUTES.listings}>
              <Button size="lg" className="h-12 w-full px-8 text-base shadow-brand-md sm:w-auto">
                Browse listings
              </Button>
            </Link>
            {hasAuthState ? (
              <Link href={sellHref}>
                <span className="btn-brand-accent inline-flex h-12 w-full items-center justify-center px-8 text-base sm:w-auto">
                  Start selling
                </span>
              </Link>
            ) : (
              <Link href={WEB_APP_ROUTES.register}>
                <span className="btn-brand-accent inline-flex h-12 w-full items-center justify-center px-8 text-base sm:w-auto">
                  Join free
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
          <div
            className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-[hsl(var(--brand-accent)/0.15)] blur-2xl"
            aria-hidden
          />
          <div className="surface-section relative flex flex-col items-center gap-6 p-8 sm:p-10">
            <Image
              src="/brand/sellnearby/svg/icon-mark.svg"
              alt=""
              width={200}
              height={200}
              className="h-40 w-40 sm:h-48 sm:w-48"
              priority
            />
            <p className="text-center text-sm font-medium text-muted-foreground">
              The SellNearby beacon — discover listings radiating from your neighbourhood.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {(['monogram', 'bridge'] as const).map((concept) => (
                <Image
                  key={concept}
                  src={`/brand/sellnearby/svg/icon-mark-concept-${concept}.svg`}
                  alt={`${concept} logo concept`}
                  width={56}
                  height={56}
                  className={cn(
                    'h-14 w-14 rounded-xl border border-border bg-background p-1.5 opacity-80 transition-opacity hover:opacity-100',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
