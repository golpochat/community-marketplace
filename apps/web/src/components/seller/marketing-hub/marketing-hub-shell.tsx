"use client";

import type { ReactNode } from "react";

import {
  MarketingHubProvider,
  useMarketingHub,
} from "@/components/seller/marketing-hub/marketing-hub-context";

function MarketingHubChrome({
  title = "Marketing hub",
  description = "Irish English · tools for this step",
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const { quota, loadingQuota } = useMarketingHub();

  if (loadingQuota || !quota) return null;
  if (!quota.published || !quota.deployEnabled) return null;

  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            {title}
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            {description}
          </p>
        </div>
        <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {quota.sellerVerified
            ? `${quota.freeUnitsRemaining} free units left`
            : "Verified sellers get free units"}
          {" · "}€{quota.walletBalance.toFixed(2)} credit
        </p>
      </div>

      {!quota.enabled && (
        <p className="mt-2 text-xs text-amber-700">
          Marketing tools are temporarily unavailable.
        </p>
      )}

      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

export function MarketingHubShell({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <MarketingHubProvider>
      <MarketingHubChrome title={title} description={description}>
        {children}
      </MarketingHubChrome>
    </MarketingHubProvider>
  );
}

export function MarketingHubWidget({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 border-t border-[hsl(var(--dashboard-sidebar-border)/0.7)] pt-3 first:border-t-0 first:pt-0">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
