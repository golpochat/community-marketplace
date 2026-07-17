'use client';

import Link from 'next/link';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { SELLER_ROUTES } from '@/lib/seller-routes';

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function HubCard({
  href,
  title,
  description,
  highlight,
}: {
  href: string;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        highlight
          ? 'rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-brand-sm transition-colors hover:border-primary/50'
          : 'rounded-xl border border-border bg-card p-5 shadow-brand-sm transition-colors hover:border-primary/40'
      }
    >
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

export function AccountHomeContent() {
  const { phase, loading } = useSellerOnboarding();

  return (
    <>
      <PageHeader
        title="Your account"
        description="Buy locally, sell when you are ready — one login for everything on SellNearby."
      />

      <div className="space-y-8">
        <section>
          <SectionHeading title="Shopping" description="Browse, buy, and track your orders." />
          <div className="grid gap-4 sm:grid-cols-2">
            <HubCard
              href={WEB_APP_ROUTES.accountPurchases}
              title="Purchases"
              description="Track orders and pay for listings."
            />
            <HubCard
              href={WEB_APP_ROUTES.accountSaved}
              title="Saved items"
              description="Listings you have favourited."
            />
            <HubCard
              href={WEB_APP_ROUTES.listings}
              title="Browse listings"
              description="Discover items from sellers near you."
            />
            <HubCard
              href={WEB_APP_ROUTES.accountDisputes}
              title="Disputes"
              description="View and respond to purchase disputes."
            />
          </div>
        </section>

        <section>
          <SectionHeading
            title="Selling"
            description={
              loading
                ? 'Loading selling status…'
                : phase === 'buyer_only'
                  ? 'Ready to list something? Start here — we will walk you through setup.'
                  : phase === 'setup_in_progress'
                    ? 'Finish setup to publish listings and receive payouts.'
                    : 'Manage what you sell on SellNearby.'
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {loading ? (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : phase === 'buyer_only' ? (
              <HubCard
                href={WEB_APP_ROUTES.accountSelling}
                title="Start selling"
                description="Choose your seller type, set up a storefront, list items, then verify for payouts."
                highlight
              />
            ) : phase === 'setup_in_progress' ? (
              <>
                <HubCard
                  href={WEB_APP_ROUTES.accountSelling}
                  title="Continue seller setup"
                  description="Pick up where you left off — storefront, listings, verification, and payouts."
                  highlight
                />
                <HubCard
                  href={SELLER_ROUTES.storefront}
                  title="Storefront"
                  description="Set up your shop name and branding before you list."
                />
              </>
            ) : phase === 'suspended' ? (
              <HubCard
                href={WEB_APP_ROUTES.accountSelling}
                title="Seller account"
                description="Your selling access is restricted. View details and next steps."
              />
            ) : (
              <>
                <HubCard
                  href={WEB_APP_ROUTES.accountListings}
                  title="My listings"
                  description="Manage active, draft, and sold listings."
                />
                <HubCard
                  href="/account/listings/create"
                  title="Create listing"
                  description="Add a new item for local buyers."
                />
                <HubCard
                  href={SELLER_ROUTES.storefront}
                  title="Storefront"
                  description="Edit your shop name, branding, and public store page."
                />
                <HubCard
                  href={WEB_APP_ROUTES.accountEarnings}
                  title="Earnings"
                  description="Track sales and manage Stripe payouts."
                />
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
