"use client";

import { useEffect, useState } from "react";

import { Button } from "@community-marketplace/ui";
import type { AiMarketingQuotaSummary } from "@community-marketplace/types";

import { ApiClientError } from "@/lib/api-client";
import { useMarketingHubOptional } from "@/components/seller/marketing-hub/marketing-hub-context";
import { aiMarketingService } from "@/services/ai-marketing.service";
import { SellerGrowthPackDialog } from "@/components/seller/seller-growth-pack-dialog";

interface ListingAiCampaignPanelProps {
  listingId?: string;
  listingStatus?: string;
  onBoostListing?: () => void;
  embedded?: boolean;
}

export function ListingAiCampaignPanel({
  listingId,
  listingStatus,
  onBoostListing,
  embedded = false,
}: ListingAiCampaignPanelProps) {
  const hub = useMarketingHubOptional();
  const [localQuota, setLocalQuota] = useState<AiMarketingQuotaSummary | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [packDownloaded, setPackDownloaded] = useState(false);
  const [growthPackOpen, setGrowthPackOpen] = useState(false);

  const quota = embedded ? hub?.quota ?? null : localQuota;

  useEffect(() => {
    if (embedded) return;
    void aiMarketingService
      .getQuota()
      .then(setLocalQuota)
      .catch(() => setLocalQuota(null));
  }, [embedded]);

  if (!listingId) return null;
  if (!embedded && quota && (!quota.published || !quota.deployEnabled)) {
    return null;
  }

  const canBoost = Boolean(onBoostListing) && listingStatus === "active";
  const disabled = busy || quota?.enabled === false || Boolean(hub?.disabled);

  async function downloadPack() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await aiMarketingService.downloadCampaignPack(listingId!);
      setPackDownloaded(true);
      setNotice("Campaign pack downloaded — ready for step 3.");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not download campaign pack.",
      );
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <>
      {!embedded && (
        <div className="mb-3">
          <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            Campaign pack & boost
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Guided funnel · creatives → share → boost on SellNearby
          </p>
        </div>
      )}

      <ol className="space-y-3 text-sm">
        <li className="rounded-md border border-[hsl(var(--dashboard-sidebar-border)/0.7)] p-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Step 1 · Creatives
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Download a zip of your latest captions and banners (free).
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            disabled={disabled}
            onClick={() => void downloadPack()}
          >
            {busy
              ? "Preparing…"
              : packDownloaded
                ? "Download again · free"
                : "Download campaign pack · free"}
          </Button>
        </li>

        <li className="rounded-md border border-[hsl(var(--dashboard-sidebar-border)/0.7)] p-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Step 2 · Share off SellNearby
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Use the Share widgets above to copy Instagram, TikTok, WhatsApp, or
            email posts. Optional: add SellNearby Credit with a Growth Pack.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            disabled={disabled}
            onClick={() => setGrowthPackOpen(true)}
          >
            Get Growth Pack
          </Button>
        </li>

        <li className="rounded-md border border-[hsl(var(--dashboard-sidebar-border)/0.7)] p-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Step 3 · Boost on SellNearby
          </p>
          {canBoost ? (
            <>
              <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Promote this listing in search with a Boosted badge.
                {packDownloaded
                  ? " Creatives ready — boost when you are."
                  : " You can boost without downloading first."}
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                disabled={disabled}
                onClick={onBoostListing}
              >
                Boost this listing
              </Button>
            </>
          ) : (
            <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Boost unlocks when the listing is live (after admin approval).
            </p>
          )}
        </li>
      </ol>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {notice && (
        <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {notice}
        </p>
      )}

      <SellerGrowthPackDialog
        open={growthPackOpen}
        onClose={() => setGrowthPackOpen(false)}
        onSuccess={() => {
          setGrowthPackOpen(false);
          setNotice(
            "Growth Pack purchased — credit added. Hub boosts can use your pack discount.",
          );
        }}
      />
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] p-3">
      {body}
    </div>
  );
}
