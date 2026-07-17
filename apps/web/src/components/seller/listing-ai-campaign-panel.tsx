"use client";

import { useEffect, useState } from "react";

import { Button } from "@community-marketplace/ui";
import type { AiMarketingQuotaSummary } from "@community-marketplace/types";

import { ApiClientError } from "@/lib/api-client";
import { useMarketingHubOptional } from "@/components/seller/marketing-hub/marketing-hub-context";
import { aiMarketingService } from "@/services/ai-marketing.service";

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
      setNotice("Campaign pack downloaded.");
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
            Zip latest captions + banners (free) · then boost on SellNearby
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => void downloadPack()}
        >
          {busy ? "Preparing…" : "Download campaign pack · free"}
        </Button>
        {canBoost && (
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={onBoostListing}
          >
            Boost this listing
          </Button>
        )}
      </div>

      {!canBoost && listingStatus && listingStatus !== "active" && (
        <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          Boost is available once the listing is live.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {notice && (
        <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {notice}
        </p>
      )}
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] p-3">
      {body}
    </div>
  );
}
