"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@community-marketplace/ui";
import {
  formatAiMarketingTaskCostLabel,
  type AiMarketingImageResult,
} from "@community-marketplace/types";

import { ApiClientError } from "@/lib/api-client";
import { useMarketingHubOptional } from "@/components/seller/marketing-hub/marketing-hub-context";
import { FeaturedStoreDialog } from "@/components/seller/featured-store-dialog";
import { WEB_APP_ROUTES } from "@/lib/rbac-routes";
import { aiMarketingService } from "@/services/ai-marketing.service";

interface StoreAiBannerPanelProps {
  storeId: string;
  storeName: string;
  hasLogo: boolean;
  onBannerApplied: (bannerUrl: string) => void;
}

export function StoreAiBannerPanel({
  storeId,
  storeName,
  hasLogo,
  onBannerApplied,
}: StoreAiBannerPanelProps) {
  const hub = useMarketingHubOptional();
  const [busy, setBusy] = useState<"generate" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiMarketingImageResult | null>(null);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [applied, setApplied] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);

  const disabled = busy !== null || hub?.disabled || hub?.quota?.enabled === false;

  async function generate() {
    setBusy("generate");
    setError(null);
    setApplied(false);
    try {
      const next = await aiMarketingService.processStoreBanner({
        storeId,
        includeWatermark,
      });
      setResult(next);
      hub?.patchQuota({
        freeUnitsRemaining: next.freeUnitsRemaining,
        walletBalance: next.walletBalance,
      });
      await hub?.refreshQuota();
    } catch (err) {
      setResult(null);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not generate shop banner. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    if (!result?.generationId) return;
    setBusy("apply");
    setError(null);
    try {
      const appliedResult = await aiMarketingService.applyStoreBanner(
        result.generationId,
        storeId,
      );
      setApplied(true);
      onBannerApplied(appliedResult.bannerUrl);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not apply banner to storefront.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Creates a 1600×400 storefront hero for{" "}
        <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">
          {storeName}
        </span>
        . Uses your store logo when available
        {hasLogo ? "" : " (add a logo first for a stronger banner)"}.
      </p>

      <label className="flex items-center gap-2 text-xs text-[hsl(var(--dashboard-main-fg))]">
        <input
          type="checkbox"
          checked={includeWatermark}
          onChange={(event) => setIncludeWatermark(event.target.checked)}
          disabled={disabled}
        />
        Include SellNearby watermark
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={() => void generate()}
        >
          {busy === "generate"
            ? "Generating…"
            : `AI shop banner · ${formatAiMarketingTaskCostLabel("store_banner")}`}
        </Button>
        {result?.publicUrl ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || applied}
              onClick={() => void apply()}
            >
              {busy === "apply"
                ? "Applying…"
                : applied
                  ? "Applied to storefront"
                  : "Apply to storefront"}
            </Button>
            <Button type="button" size="sm" variant="ghost" asChild>
              <a href={result.publicUrl} target="_blank" rel="noopener noreferrer">
                Preview
              </a>
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setFeatureOpen(true)}
        >
          Feature this shop
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {result?.publicUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.publicUrl}
          alt="Generated shop banner preview"
          className="mt-1 w-full max-w-xl rounded-md border border-[hsl(var(--dashboard-sidebar-border))] object-cover"
        />
      ) : null}

      {applied ? (
        <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
            Banner applied — promote your shop next
          </p>
          <p className="mt-1">
            Feature this storefront on the homepage, or boost a live listing to drive
            traffic.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setFeatureOpen(true)}>
              Feature this shop
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={WEB_APP_ROUTES.accountListings}>My listings →</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <FeaturedStoreDialog
        open={featureOpen}
        storeId={storeId}
        onClose={() => setFeatureOpen(false)}
        onSuccess={() => setFeatureOpen(false)}
      />
    </div>
  );
}
