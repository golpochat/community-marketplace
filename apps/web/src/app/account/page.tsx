import Link from 'next/link';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export default function AccountHomePage() {
  return (
    <>
      <PageHeader
        title="Your account"
        description="Buy locally, sell when you are ready — one login for everything on SellNearby."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={WEB_APP_ROUTES.accountPurchases}
          className="rounded-xl border border-border bg-card p-5 shadow-brand-sm transition-colors hover:border-primary/40"
        >
          <h2 className="font-semibold text-foreground">Purchases</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track orders and pay for listings.</p>
        </Link>
        <Link
          href={WEB_APP_ROUTES.accountSaved}
          className="rounded-xl border border-border bg-card p-5 shadow-brand-sm transition-colors hover:border-primary/40"
        >
          <h2 className="font-semibold text-foreground">Saved items</h2>
          <p className="mt-1 text-sm text-muted-foreground">Listings you have favourited.</p>
        </Link>
        <Link
          href={WEB_APP_ROUTES.accountListings}
          className="rounded-xl border border-border bg-card p-5 shadow-brand-sm transition-colors hover:border-primary/40"
        >
          <h2 className="font-semibold text-foreground">My listings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage what you are selling.</p>
        </Link>
        <Link
          href={WEB_APP_ROUTES.accountStartSelling}
          className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-brand-sm transition-colors hover:border-primary/50"
        >
          <h2 className="font-semibold text-foreground">Start selling</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            List items locally — choose individual, sole trader, or company.
          </p>
        </Link>
      </div>
    </>
  );
}
