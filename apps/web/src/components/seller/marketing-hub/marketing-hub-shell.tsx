'use client';

import { useState, type ReactNode } from "react";

import {
  MarketingHubProvider,
  useMarketingHub,
} from "@/components/seller/marketing-hub/marketing-hub-context";
import { formatAiMarketingQuotaSummary } from "@community-marketplace/types";
import { cn } from "@community-marketplace/ui";

/** Renders children only when marketing tools are published and deploy-enabled. */
export function MarketingHubGate({
  children,
  showQuota = false,
}: {
  children: ReactNode;
  /** When true, show a compact free-units / wallet line above children. */
  showQuota?: boolean;
}) {
  const { quota, loadingQuota } = useMarketingHub();

  if (loadingQuota || !quota) return null;
  if (!quota.published || !quota.deployEnabled) return null;

  return (
    <div className="space-y-2">
      {showQuota ? (
        <p className="text-right text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {formatAiMarketingQuotaSummary(quota)}
        </p>
      ) : null}
      {!quota.enabled ? (
        <p className="text-xs text-amber-700">
          Marketing tools are temporarily unavailable.
        </p>
      ) : null}
      {children}
    </div>
  );
}

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
        <p className="max-w-xs text-right text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {formatAiMarketingQuotaSummary(quota)}
        </p>
      </div>

      {!quota.enabled && (
        <p className="mt-2 text-xs text-amber-700">
          Marketing tools are temporarily unavailable.
        </p>
      )}

      <div className="mt-3 space-y-3">{children}</div>
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

/** Provider only — use with MarketingHubGate + MarketingHubWidget under form fields. */
export function MarketingHubRoot({ children }: { children: ReactNode }) {
  return <MarketingHubProvider>{children}</MarketingHubProvider>;
}

export function MarketingHubWidget({
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = false,
  badge,
  compact = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  /** When collapsible, start expanded (default true for backwards compat). */
  defaultOpen?: boolean;
  collapsible?: boolean;
  badge?: string;
  /** Tighter styling for placement under a single form field. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const sectionClass = compact
    ? "mt-2 rounded-lg border border-[hsl(var(--dashboard-sidebar-border)/0.8)] bg-[hsl(var(--dashboard-sidebar-active)/0.2)] p-2.5"
    : "space-y-2 border-t border-[hsl(var(--dashboard-sidebar-border)/0.7)] pt-3 first:border-t-0 first:pt-0";

  if (!collapsible) {
    return (
      <section className={sectionClass}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            {title}
            {badge ? (
              <span className="ml-2 font-normal normal-case">· {badge}</span>
            ) : null}
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

  return (
    <section
      className={
        compact
          ? sectionClass
          : "border-t border-[hsl(var(--dashboard-sidebar-border)/0.7)] pt-3 first:border-t-0 first:pt-0"
      }
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2 text-left"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            {title}
            {badge ? (
              <span className="ml-2 font-normal normal-case">· {badge}</span>
            ) : null}
          </p>
          {description ? (
            <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {description}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "mt-0.5 shrink-0 text-xs text-[hsl(var(--dashboard-sidebar-muted))]",
          )}
          aria-hidden
        >
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? <div className="mt-2 space-y-2">{children}</div> : null}
    </section>
  );
}
