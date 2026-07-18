'use client';

import { useState } from 'react';

import type { StoreAnalytics, StoreContactInfo, StoreOpeningHours, StorePolicy } from '@community-marketplace/types';
import { ChevronDown } from 'lucide-react';

import { StoreContactSection } from '@/components/storefront/store-contact-section';
import { StoreOpeningHoursPanel } from '@/components/storefront/store-opening-hours-panel';
import { StorePolicySection } from '@/components/storefront/store-policy-section';
import { VerifiedSellerIcon } from '@/components/trust/verified-seller-icon';

interface StoreDetailsSectionProps {
  description: string;
  memberSince: string;
  analytics: StoreAnalytics;
  policies: StorePolicy;
  verified: boolean;
  contact?: StoreContactInfo;
  openingHours?: StoreOpeningHours;
}

function CollapsiblePanel({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-brand-md border border-border bg-card shadow-brand-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3.5 text-left lg:pointer-events-none lg:cursor-default"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground/70 transition-transform lg:hidden ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <div className={`border-t border-border px-4 pb-4 pt-3 ${open ? 'block' : 'hidden lg:block'}`}>
        {children}
      </div>
    </div>
  );
}

export function StoreDetailsSection({
  description,
  memberSince,
  analytics,
  policies,
  verified,
  contact,
  openingHours,
}: StoreDetailsSectionProps) {
  const joinedYear = memberSince ? new Date(memberSince).getFullYear() : null;
  const hasDescription = description.trim() && description !== 'No store description yet.';
  const hasPolicies = Boolean(policies.returns || policies.shipping || policies.responseTime);
  const hasContact = Boolean(
    contact?.city ||
      contact?.addressLine ||
      contact?.phone ||
      contact?.email ||
      contact?.website,
  );
  const hasHours = Boolean(openingHours?.schedule && Object.keys(openingHours.schedule).length > 0);

  return (
    <div className="space-y-4">
      {verified ? (
        <div className="flex items-start gap-3 rounded-brand-md border border-emerald-200 bg-emerald-50/80 px-4 py-3">
          <VerifiedSellerIcon size="lg" className="mt-0.5" />
          <p className="text-sm leading-relaxed text-emerald-900">
            Identity checked by SellNearby. Shop with confidence.
          </p>
        </div>
      ) : null}

      {hasContact ? (
        <CollapsiblePanel title="Contact & location" defaultOpen>
          <StoreContactSection contact={contact} />
        </CollapsiblePanel>
      ) : null}

      {hasHours ? (
        <CollapsiblePanel title="Opening hours" defaultOpen>
          <StoreOpeningHoursPanel openingHours={openingHours} />
        </CollapsiblePanel>
      ) : null}

      <CollapsiblePanel title="About this store">
        {hasDescription ? (
          <p className="text-sm leading-relaxed text-foreground">{description}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            This seller has not added a store description yet.
          </p>
        )}
        {joinedYear ? (
          <p className="mt-3 text-xs font-medium text-muted-foreground">Selling since {joinedYear}</p>
        ) : null}
      </CollapsiblePanel>

      {hasPolicies ? (
        <CollapsiblePanel title="Seller policies" defaultOpen={false}>
          <StorePolicySection policies={policies} embedded />
        </CollapsiblePanel>
      ) : null}

      {analytics.totalViews > 0 ? (
        <div className="rounded-brand-md border border-border bg-card px-4 py-3 text-center shadow-brand-sm">
          <p className="text-2xl font-bold text-foreground">{analytics.totalViews.toLocaleString()}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Store views</p>
        </div>
      ) : null}
    </div>
  );
}
