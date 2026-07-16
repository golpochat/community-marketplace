"use client";

import { useEffect, useState } from "react";

import { Button } from "@community-marketplace/ui";
import type {
  AiMarketingQuotaSummary,
  AiPriceSuggestionResult,
} from "@community-marketplace/types";

import { ApiClientError } from "@/lib/api-client";
import { useMarketingHubOptional } from "@/components/seller/marketing-hub/marketing-hub-context";
import { aiMarketingService } from "@/services/ai-marketing.service";

interface ListingAiPricePanelProps {
  listingId?: string;
  categoryId?: string;
  condition?: string;
  location?: string;
  make?: string;
  model?: string;
  year?: string | number;
  onApplySuggestedPrice: (price: string) => void;
  embedded?: boolean;
}

function confidenceLabel(confidence: AiPriceSuggestionResult["confidence"]) {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
    default:
      return "Not enough comps";
  }
}

export function ListingAiPricePanel({
  listingId,
  categoryId,
  condition,
  location,
  make,
  model,
  year,
  onApplySuggestedPrice,
  embedded = false,
}: ListingAiPricePanelProps) {
  const hub = useMarketingHubOptional();
  const [localQuota, setLocalQuota] = useState<AiMarketingQuotaSummary | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiPriceSuggestionResult | null>(null);

  const quota = embedded ? hub?.quota ?? null : localQuota;

  useEffect(() => {
    if (embedded) return;
    void aiMarketingService
      .getQuota()
      .then(setLocalQuota)
      .catch(() => setLocalQuota(null));
  }, [embedded]);

  if (!embedded && quota && (!quota.published || !quota.deployEnabled)) {
    return null;
  }

  const canSuggest = Boolean(listingId || categoryId);
  const disabled = busy || quota?.enabled === false || Boolean(hub?.disabled);

  async function run() {
    if (!canSuggest || disabled) return;
    setBusy(true);
    setError(null);
    try {
      const next = await aiMarketingService.suggestPrice({
        listingId,
        categoryId: listingId ? undefined : categoryId,
        condition,
        location,
        make,
        model,
        year,
      });
      setResult(next);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not suggest a price. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!embedded && (
          <div>
            <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
              Price suggestion
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Free · based on similar active SellNearby listings
            </p>
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canSuggest || disabled}
          onClick={() => void run()}
        >
          {busy ? "Checking…" : "Suggest price"}
        </Button>
      </div>

      {!canSuggest && (
        <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          Save the listing or pick a category first.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {result && (
        <div className="mt-3 space-y-2 rounded-md border border-[hsl(var(--dashboard-sidebar-border))] p-3">
          {result.suggestedPrice != null ? (
            <>
              <p className="text-sm text-[hsl(var(--dashboard-main-fg))]">
                Suggested around{" "}
                <span className="font-semibold">€{result.suggestedPrice}</span>
                {result.suggestedMin != null && result.suggestedMax != null
                  ? ` · typical €${result.suggestedMin}–€${result.suggestedMax}`
                  : ""}
              </p>
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                {confidenceLabel(result.confidence)} · {result.compCount} comps
                {result.areaMatched ? ` · near ${result.areaMatched}` : ""}
              </p>
              <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                {result.explanation}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  onApplySuggestedPrice(String(result.suggestedPrice))
                }
              >
                Use suggested price
              </Button>
            </>
          ) : (
            <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {result.explanation}
            </p>
          )}
          <p className="text-[11px] text-[hsl(var(--dashboard-sidebar-muted))]">
            {result.disclaimer}
          </p>
        </div>
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
