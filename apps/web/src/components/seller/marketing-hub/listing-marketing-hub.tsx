"use client";

import type { AiMarketingTask, ListingImage } from "@community-marketplace/types";

import { ListingAiCampaignPanel } from "@/components/seller/listing-ai-campaign-panel";
import { ListingAiImagePanel } from "@/components/seller/listing-ai-image-panel";
import { ListingAiPanel } from "@/components/seller/listing-ai-panel";
import { ListingAiPostingTimePanel } from "@/components/seller/listing-ai-posting-time-panel";
import { ListingAiPricePanel } from "@/components/seller/listing-ai-price-panel";
import {
  MarketingHubShell,
  MarketingHubWidget,
} from "@/components/seller/marketing-hub/marketing-hub-shell";

export type MarketingHubStep = "details" | "pricing" | "photos";

interface ListingMarketingHubProps {
  step: MarketingHubStep;
  listingId?: string;
  listingStatus?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  condition?: string;
  location?: string;
  price?: string;
  make?: string;
  model?: string;
  year?: string | number;
  images?: ListingImage[];
  hiddenTasks?: AiMarketingTask[];
  descriptionAcceptLabel?: string;
  onAcceptTitle?: (title: string) => void;
  onAcceptDescription?: (description: string) => void;
  onApplySuggestedPrice?: (price: string) => void;
  onListingImagesChange?: (images: ListingImage[]) => void;
  onBoostListing?: () => void;
}

const STEP_COPY: Record<
  MarketingHubStep,
  { title: string; description: string }
> = {
  details: {
    title: "Marketing hub",
    description: "Improve listing copy, social posts, and when to share",
  },
  pricing: {
    title: "Marketing hub",
    description: "Price guidance from similar SellNearby listings",
  },
  photos: {
    title: "Marketing hub",
    description: "Photo tools, share banners, campaign pack, and boost",
  },
};

export function ListingMarketingHub({
  step,
  listingId,
  listingStatus,
  title = "",
  description = "",
  categoryId,
  categoryName,
  condition,
  location,
  price,
  make,
  model,
  year,
  images = [],
  hiddenTasks,
  descriptionAcceptLabel,
  onAcceptTitle,
  onAcceptDescription,
  onApplySuggestedPrice,
  onListingImagesChange,
  onBoostListing,
}: ListingMarketingHubProps) {
  const copy = STEP_COPY[step];

  return (
    <MarketingHubShell title={copy.title} description={copy.description}>
      {step === "details" && (
        <>
          <MarketingHubWidget
            title="Copy & social"
            description="Apply SEO title and description in-form · copy social posts to paste elsewhere"
          >
            <ListingAiPanel
              embedded
              listingId={listingId}
              title={title}
              description={description}
              categoryName={categoryName}
              condition={condition}
              location={location}
              price={price}
              hiddenTasks={hiddenTasks}
              descriptionAcceptLabel={descriptionAcceptLabel}
              onAcceptTitle={onAcceptTitle ?? (() => undefined)}
              onAcceptDescription={onAcceptDescription ?? (() => undefined)}
            />
          </MarketingHubWidget>
          <MarketingHubWidget
            title="Best posting time"
            description="Europe/Dublin · free"
          >
            <ListingAiPostingTimePanel
              embedded
              listingId={listingId}
              categoryId={categoryId}
            />
          </MarketingHubWidget>
        </>
      )}

      {step === "pricing" && onApplySuggestedPrice && (
        <MarketingHubWidget
          title="Price suggestion"
          description="Based on similar active listings · free"
        >
          <ListingAiPricePanel
            embedded
            listingId={listingId}
            categoryId={categoryId}
            condition={condition}
            location={location}
            make={make}
            model={model}
            year={year}
            onApplySuggestedPrice={onApplySuggestedPrice}
          />
        </MarketingHubWidget>
      )}

      {step === "photos" && listingId && (
        <>
          {images.length > 0 && (
            <MarketingHubWidget
              title="Photos & banners"
              description="Enhance or remove background for listing use · banners are marketing-only"
            >
              <ListingAiImagePanel
                embedded
                listingId={listingId}
                images={images}
                onListingImagesChange={onListingImagesChange}
              />
            </MarketingHubWidget>
          )}
          <MarketingHubWidget
            title="Campaign & boost"
            description="Download latest captions and banners · boost when the listing is live"
          >
            <ListingAiCampaignPanel
              embedded
              listingId={listingId}
              listingStatus={listingStatus}
              onBoostListing={onBoostListing}
            />
          </MarketingHubWidget>
        </>
      )}
    </MarketingHubShell>
  );
}
