"use client";

import type { AiMarketingTask, ListingImage } from "@community-marketplace/types";
import { LISTING_TITLE_MIN_LENGTH } from "@community-marketplace/utils";

import { ListingAiCampaignPanel } from "@/components/seller/listing-ai-campaign-panel";
import { ListingAiImagePanel } from "@/components/seller/listing-ai-image-panel";
import { ListingAiPanel } from "@/components/seller/listing-ai-panel";
import { ListingAiPostingTimePanel } from "@/components/seller/listing-ai-posting-time-panel";
import { ListingAiPricePanel } from "@/components/seller/listing-ai-price-panel";
import {
  MarketingHubGate,
  MarketingHubShell,
  MarketingHubWidget,
} from "@/components/seller/marketing-hub/marketing-hub-shell";

export { MarketingHubRoot } from "@/components/seller/marketing-hub/marketing-hub-shell";

export type MarketingHubStep = "details" | "pricing" | "photos" | "share";

/** Split details AI so each block can sit under its form field. */
export type MarketingHubDetailsSection =
  | "all"
  | "title"
  | "description"
  | "extras";

interface ListingMarketingHubProps {
  step: MarketingHubStep;
  /** When step is details, which AI block to render (default all). */
  detailsSection?: MarketingHubDetailsSection;
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
  descriptionAssistTitle?: string;
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
    title: "Need help writing?",
    description:
      "Accept fills title/description · Copy is for social apps · free units first, then €0.05/unit",
  },
  pricing: {
    title: "Price guidance",
    description: "Free suggestion from similar SellNearby listings · advisory only",
  },
  photos: {
    title: "Improve photos & share",
    description:
      "Upload photos first · enhance/bg-remove may apply to listing · banners are marketing-only",
  },
  share: {
    title: "Share this listing",
    description:
      "Copy social posts · free posting times · photo tools and campaign pack · boost when live",
  },
};

function DetailsTitleAssist(props: ListingMarketingHubProps) {
  const {
    listingId,
    title = "",
    description = "",
    categoryName,
    condition,
    location,
    price,
    hiddenTasks = [],
    onAcceptTitle,
    onAcceptDescription,
  } = props;

  return (
    <MarketingHubWidget
      title="Improve title"
      description="AI SEO title applies into the field above"
      badge="Accept"
      collapsible
      defaultOpen={false}
      compact
    >
      <ListingAiPanel
        embedded
        taskGroup="listing"
        listingId={listingId}
        title={title}
        description={description}
        categoryName={categoryName}
        condition={condition}
        location={location}
        price={price}
        hiddenTasks={[...hiddenTasks, "description"]}
        onAcceptTitle={onAcceptTitle ?? (() => undefined)}
        onAcceptDescription={onAcceptDescription ?? (() => undefined)}
      />
    </MarketingHubWidget>
  );
}

function DetailsDescriptionAssist(props: ListingMarketingHubProps) {
  const {
    listingId,
    title = "",
    description = "",
    categoryName,
    condition,
    location,
    price,
    hiddenTasks = [],
    descriptionAcceptLabel,
    descriptionAssistTitle = "Improve description",
    onAcceptTitle,
    onAcceptDescription,
  } = props;

  return (
    <MarketingHubWidget
      title={descriptionAssistTitle}
      description="AI copy applies into the field above"
      badge="Accept"
      collapsible
      defaultOpen={false}
      compact
    >
      <ListingAiPanel
        embedded
        taskGroup="listing"
        listingId={listingId}
        title={title}
        description={description}
        categoryName={categoryName}
        condition={condition}
        location={location}
        price={price}
        hiddenTasks={[...hiddenTasks, "seo_title"]}
        descriptionAcceptLabel={descriptionAcceptLabel}
        onAcceptTitle={onAcceptTitle ?? (() => undefined)}
        onAcceptDescription={onAcceptDescription ?? (() => undefined)}
      />
    </MarketingHubWidget>
  );
}

function DetailsExtrasAssist(props: ListingMarketingHubProps) {
  const {
    listingId,
    title = "",
    description = "",
    categoryId,
    categoryName,
    condition,
    location,
    price,
    hiddenTasks,
    descriptionAcceptLabel,
    onAcceptTitle,
    onAcceptDescription,
  } = props;
  const titleReady = title.trim().length >= LISTING_TITLE_MIN_LENGTH;

  return (
    <>
      <MarketingHubWidget
        title="Share off SellNearby"
        description={
          titleReady
            ? "Copy captions for Instagram, TikTok, WhatsApp, and more"
            : `Add a title (at least ${LISTING_TITLE_MIN_LENGTH} characters) first so posts match your item`
        }
        badge="Copy only"
        collapsible
        defaultOpen={false}
        compact
      >
        <ListingAiPanel
          embedded
          taskGroup="social"
          requireTitleMinLength={LISTING_TITLE_MIN_LENGTH}
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
        description="Free · Europe/Dublin"
        badge="Free"
        collapsible
        defaultOpen={false}
        compact
      >
        <ListingAiPostingTimePanel
          embedded
          compact
          listingId={listingId}
          categoryId={categoryId}
        />
      </MarketingHubWidget>
    </>
  );
}

function DetailsSectionBody(
  props: ListingMarketingHubProps & { section: MarketingHubDetailsSection },
) {
  const { section } = props;

  if (section === "title") return <DetailsTitleAssist {...props} />;
  if (section === "description") return <DetailsDescriptionAssist {...props} />;
  if (section === "extras") return <DetailsExtrasAssist {...props} />;

  return (
    <>
      <DetailsTitleAssist {...props} />
      <DetailsDescriptionAssist {...props} />
      <DetailsExtrasAssist {...props} />
    </>
  );
}

export function ListingMarketingHub({
  step,
  detailsSection = "all",
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
  descriptionAssistTitle,
  onAcceptTitle,
  onAcceptDescription,
  onApplySuggestedPrice,
  onListingImagesChange,
  onBoostListing,
}: ListingMarketingHubProps) {
  const copy = STEP_COPY[step];
  const titleReady = title.trim().length >= LISTING_TITLE_MIN_LENGTH;
  const hubProps: ListingMarketingHubProps = {
    step,
    detailsSection,
    listingId,
    listingStatus,
    title,
    description,
    categoryId,
    categoryName,
    condition,
    location,
    price,
    make,
    model,
    year,
    images,
    hiddenTasks,
    descriptionAcceptLabel,
    descriptionAssistTitle,
    onAcceptTitle,
    onAcceptDescription,
    onApplySuggestedPrice,
    onListingImagesChange,
    onBoostListing,
  };

  // Field-scoped details sections: parent should wrap with MarketingHubRoot.
  if (step === "details" && detailsSection !== "all") {
    return (
      <MarketingHubGate showQuota={detailsSection === "title"}>
        <DetailsSectionBody {...hubProps} section={detailsSection} />
      </MarketingHubGate>
    );
  }

  return (
    <MarketingHubShell title={copy.title} description={copy.description}>
      {step === "details" && (
        <DetailsSectionBody {...hubProps} section="all" />
      )}

      {step === "pricing" && onApplySuggestedPrice && (
        <MarketingHubWidget
          title="Suggest price"
          description="Based on similar active listings"
          badge="Free"
          collapsible
          defaultOpen={false}
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
              title="Photo tools"
              description="Enhance 3 · bg-remove 5 · banner 4 units"
              collapsible
              defaultOpen={false}
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
            description="Campaign pack free · boost when the listing is live"
            badge="Free pack"
            collapsible
            defaultOpen={false}
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

      {step === "share" && listingId && (
        <>
          <MarketingHubWidget
            title="Share off SellNearby"
            description={
              titleReady
                ? "Copy captions for Instagram, TikTok, WhatsApp, and more"
                : `Add a title (at least ${LISTING_TITLE_MIN_LENGTH} characters) first so posts match your item`
            }
            badge="Copy only"
            collapsible
            defaultOpen
          >
            <ListingAiPanel
              embedded
              taskGroup="social"
              requireTitleMinLength={LISTING_TITLE_MIN_LENGTH}
              listingId={listingId}
              title={title}
              description={description}
              categoryName={categoryName}
              condition={condition}
              location={location}
              price={price}
              hiddenTasks={hiddenTasks}
              onAcceptTitle={onAcceptTitle ?? (() => undefined)}
              onAcceptDescription={onAcceptDescription ?? (() => undefined)}
            />
          </MarketingHubWidget>
          <MarketingHubWidget
            title="Best posting time"
            description="Free · Europe/Dublin"
            badge="Free"
            collapsible
            defaultOpen={false}
          >
            <ListingAiPostingTimePanel
              embedded
              compact
              listingId={listingId}
              categoryId={categoryId}
            />
          </MarketingHubWidget>
          {images.length > 0 && (
            <MarketingHubWidget
              title="Photo tools"
              description="Enhance 3 · bg-remove 5 · banner 4 units"
              collapsible
              defaultOpen={false}
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
            description="Campaign pack free · boost when the listing is live"
            badge="Free pack"
            collapsible
            defaultOpen
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
