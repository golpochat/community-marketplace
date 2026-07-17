"use client";

import Link from "next/link";
import { useState } from "react";

import type { ListingImage } from "@community-marketplace/types";
import { Button } from "@community-marketplace/ui";
import { Card } from "@community-marketplace/ui-dashboard";

import { ListingMarketingHub } from "@/components/seller/marketing-hub/listing-marketing-hub";
import { WEB_APP_ROUTES } from "@/lib/rbac-routes";

export interface ListingShareSuccessContext {
  listingId: string;
  listingStatus: string;
  title: string;
  description: string;
  categoryId?: string;
  categoryName?: string;
  condition?: string;
  location?: string;
  price?: string;
  images: ListingImage[];
  /** Vehicle listings hide SEO title task. */
  isVehicle?: boolean;
  message: string;
}

interface ListingShareSuccessPanelProps {
  context: ListingShareSuccessContext;
  submittingReview?: boolean;
  onSubmitForReview?: () => void | Promise<void>;
  onDone: () => void;
  onImagesChange?: (images: ListingImage[]) => void;
}

export function ListingShareSuccessPanel({
  context,
  submittingReview = false,
  onSubmitForReview,
  onDone,
  onImagesChange,
}: ListingShareSuccessPanelProps) {
  const [images, setImages] = useState(context.images);
  const canSubmit =
    Boolean(onSubmitForReview) &&
    context.listingStatus === "draft" &&
    images.length > 0;

  function handleImagesChange(next: ListingImage[]) {
    setImages(next);
    onImagesChange?.(next);
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-5">
        <div>
          <p className="text-base font-semibold text-[hsl(var(--dashboard-main-fg))]">
            Draft saved — share this listing
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            {context.message}
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--dashboard-main-fg))]">
            Prepare captions, banners, and a campaign pack now. Boost is available
            once the listing is live.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <Button
              type="button"
              size="sm"
              disabled={submittingReview}
              onClick={() => void onSubmitForReview?.()}
            >
              {submittingReview ? "Submitting…" : "Submit for review"}
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/account/listings/${context.listingId}/edit`}>
              Edit listing
            </Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Back to listings
          </Button>
        </div>

        {!images.length && (
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Add at least one photo (via Edit) before submitting for review.
          </p>
        )}
      </Card>

      <ListingMarketingHub
        step="share"
        listingId={context.listingId}
        listingStatus={context.listingStatus}
        title={context.title}
        description={context.description}
        categoryId={context.categoryId}
        categoryName={context.categoryName}
        condition={context.condition}
        location={context.location}
        price={context.price}
        images={images}
        hiddenTasks={context.isVehicle ? ["seo_title"] : undefined}
        onListingImagesChange={handleImagesChange}
      />

      <p className="text-center text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Or{" "}
        <Link
          href={WEB_APP_ROUTES.accountListings}
          className="font-medium text-[hsl(var(--dashboard-accent))] underline"
          onClick={onDone}
        >
          skip and go to My listings
        </Link>
      </p>
    </div>
  );
}
