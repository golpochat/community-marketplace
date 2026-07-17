"use client";

import { useState } from "react";
import Link from "next/link";

import type { SellerStore } from "@community-marketplace/types";
import { Button } from "@community-marketplace/ui";
import { LISTING_TITLE_MIN_LENGTH } from "@community-marketplace/utils";

import { ListingAiPanel } from "@/components/seller/listing-ai-panel";
import { ListingAiPostingTimePanel } from "@/components/seller/listing-ai-posting-time-panel";
import { StoreAiBannerPanel } from "@/components/seller/store-ai-banner-panel";
import {
  MarketingHubShell,
  MarketingHubWidget,
} from "@/components/seller/marketing-hub/marketing-hub-shell";
import { isStorefrontComplete } from "@/hooks/use-seller-store-data";
import { getPublicStorefrontPath } from "@/lib/storefront-path";

interface StoreMarketingHubProps {
  store: SellerStore;
  /** Live form values so AI uses unsaved edits. */
  name: string;
  description: string;
  location: string;
  onAcceptName: (name: string) => void;
  onAcceptDescription: (description: string) => void;
  onBannerApplied?: (bannerUrl: string) => void;
}

function publicStoreUrl(slug: string): string {
  const path = getPublicStorefrontPath(slug);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function StoreMarketingHub({
  store,
  name,
  description,
  location,
  onAcceptName,
  onAcceptDescription,
  onBannerApplied,
}: StoreMarketingHubProps) {
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const complete = isStorefrontComplete({
    ...store,
    name,
    description,
    location,
  });
  const title = name.trim() || store.name;
  const body = description.trim() || store.description || "";
  const place = location.trim() || store.location || "";

  async function copyShopUrl() {
    setCopyNotice(null);
    try {
      await navigator.clipboard.writeText(publicStoreUrl(store.slug));
      setCopyNotice("Shop URL copied — paste it into Instagram, WhatsApp, or email.");
    } catch {
      setCopyNotice("Could not copy. Use the public storefront link above.");
    }
  }

  return (
    <MarketingHubShell
      title="Promote your shop"
      description="Share your storefront off SellNearby · Irish English · free units first, then €0.05/unit"
    >
      {!complete ? (
        <p className="text-xs text-amber-800">
          Add a store name, description, and logo first so AI copy matches your shop.
          Save storefront when you are ready.
        </p>
      ) : null}

      <MarketingHubWidget
        title="Shop link"
        description="Copy your public storefront URL for bios, stories, and group posts"
        badge="Free"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void copyShopUrl()}>
            Copy shop URL
          </Button>
          <Button type="button" size="sm" variant="ghost" asChild>
            <Link
              href={getPublicStorefrontPath(store.slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open storefront
            </Link>
          </Button>
        </div>
        {copyNotice ? (
          <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            {copyNotice}
          </p>
        ) : null}
      </MarketingHubWidget>

      <MarketingHubWidget
        title="Shop copy & social"
        description="Accept fills name/description above · Copy for Instagram, Facebook, TikTok, WhatsApp, email"
        badge="Accept / Copy"
        collapsible
        defaultOpen={complete}
      >
        <ListingAiPanel
          embedded
          taskGroup="all"
          title={title}
          description={body}
          categoryName="Shop"
          condition="open"
          location={place}
          requireTitleMinLength={LISTING_TITLE_MIN_LENGTH}
          descriptionAcceptLabel="Accept into store description"
          hiddenTasks={["keywords"]}
          onAcceptTitle={onAcceptName}
          onAcceptDescription={onAcceptDescription}
        />
      </MarketingHubWidget>

      <MarketingHubWidget
        title="Shop banner"
        description="1600×400 storefront hero · apply to your public shop · then feature on the homepage"
        badge="Apply"
        collapsible
        defaultOpen={false}
      >
        <StoreAiBannerPanel
          storeId={store.id}
          storeName={title}
          hasLogo={Boolean(store.logoUrl)}
          onBannerApplied={(bannerUrl) => onBannerApplied?.(bannerUrl)}
        />
      </MarketingHubWidget>

      <MarketingHubWidget
        title="Best time to promote"
        description="Free · Europe/Dublin · when Irish buyers are most active"
        badge="Free"
        collapsible
        defaultOpen={false}
      >
        <ListingAiPostingTimePanel embedded compact />
      </MarketingHubWidget>

      <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Listing photo tools, campaign packs, and boosts live on each listing form.
        Short template video is not available yet — use the TikTok script task for spoken copy.
      </p>
    </MarketingHubShell>
  );
}
