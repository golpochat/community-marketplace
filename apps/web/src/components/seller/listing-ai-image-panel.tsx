"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AI_BANNER_FORMAT_LABELS,
  AI_BANNER_TEMPLATE_LABELS,
  AI_MARKETING_TASK_LABELS,
  formatAiMarketingQuotaSummary,
  formatAiMarketingTaskCostLabel,
  type AiBannerFormat,
  type AiBannerTemplate,
  type AiMarketingImageResult,
  type AiMarketingQuotaSummary,
  type ListingImage,
} from "@community-marketplace/types";
import { Button } from "@community-marketplace/ui";

import { ApiClientError } from "@/lib/api-client";
import { resolveListingImageSrc } from "@/lib/listing-image-url";
import { useMarketingHubOptional } from "@/components/seller/marketing-hub/marketing-hub-context";
import { aiMarketingService } from "@/services/ai-marketing.service";

interface ListingAiImagePanelProps {
  listingId: string;
  images: ListingImage[];
  onListingImagesChange?: (images: ListingImage[]) => void;
  embedded?: boolean;
}

type ImageTask = "image_enhance" | "image_bg_remove" | "banner_creator";

export function ListingAiImagePanel({
  listingId,
  images,
  onListingImagesChange,
  embedded = false,
}: ListingAiImagePanelProps) {
  const hub = useMarketingHubOptional();
  const [localQuota, setLocalQuota] = useState<AiMarketingQuotaSummary | null>(
    null,
  );
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id ?? "");
  const [bannerFormat, setBannerFormat] =
    useState<AiBannerFormat>("marketplace_card");
  const [bannerTemplate, setBannerTemplate] =
    useState<AiBannerTemplate>("classic");
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [includeStoreLogo, setIncludeStoreLogo] = useState(false);
  const [busyTask, setBusyTask] = useState<ImageTask | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<AiMarketingImageResult | null>(null);

  const quota = embedded ? hub?.quota ?? null : localQuota;

  useEffect(() => {
    if (!images.some((img) => img.id === selectedImageId)) {
      setSelectedImageId(images[0]?.id ?? "");
    }
  }, [images, selectedImageId]);

  const refreshQuota = useCallback(async () => {
    if (embedded) {
      await hub?.refreshQuota();
      return;
    }
    try {
      setLocalQuota(await aiMarketingService.getQuota());
    } catch {
      setLocalQuota(null);
    }
  }, [embedded, hub]);

  useEffect(() => {
    if (embedded) return;
    void refreshQuota();
  }, [embedded, refreshQuota]);

  if (images.length === 0) {
    return null;
  }

  if (!embedded && quota && (!quota.published || !quota.deployEnabled)) {
    return null;
  }

  async function run(task: ImageTask) {
    if (!selectedImageId) return;
    setError(null);
    setNotice(null);
    setBusyTask(task);
    try {
      const next = await aiMarketingService.processImage({
        task,
        listingId,
        imageId: selectedImageId,
        bannerFormat: task === "banner_creator" ? bannerFormat : undefined,
        bannerTemplate: task === "banner_creator" ? bannerTemplate : undefined,
        includeWatermark:
          task === "banner_creator" ? includeWatermark : undefined,
        includeStoreLogo:
          task === "banner_creator" ? includeStoreLogo : undefined,
      });
      setResult(next);
      if (embedded) {
        hub?.patchQuota({
          freeUnitsRemaining: next.freeUnitsRemaining,
          walletBalance: next.walletBalance,
        });
      } else {
        setLocalQuota((prev) =>
          prev
            ? {
                ...prev,
                freeUnitsRemaining: next.freeUnitsRemaining,
                walletBalance: next.walletBalance,
              }
            : prev,
        );
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not process image. Please try again.",
      );
    } finally {
      setBusyTask(null);
    }
  }

  async function applyToListing() {
    if (!result?.mayApplyToListing) return;
    setError(null);
    setNotice(null);
    setBusyTask("apply");
    try {
      const applied = await aiMarketingService.applyImageToListing(
        result.generationId,
      );
      const refreshed = await aiMarketingService.listListingImages(listingId);
      onListingImagesChange?.(
        refreshed.length > 0 ? refreshed : [...images, ...applied.images],
      );
      setNotice("Applied to listing photos.");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not apply image to listing.",
      );
    } finally {
      setBusyTask(null);
    }
  }

  const disabled =
    Boolean(busyTask) ||
    quota?.imageToolsEnabled === false ||
    quota?.enabled === false ||
    Boolean(hub?.disabled);

  const body = (
    <>
      <div className="grid gap-2 sm:grid-cols-4">
        {images.slice(0, 8).map((image) => {
          const src = resolveListingImageSrc(
            image.thumbUrl ?? image.cardUrl ?? image.url,
            400,
          );
          const selected = image.id === selectedImageId;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImageId(image.id)}
              className={
                selected
                  ? "overflow-hidden rounded-md ring-2 ring-[hsl(var(--dashboard-accent))]"
                  : "overflow-hidden rounded-md ring-1 ring-[hsl(var(--dashboard-sidebar-border))]"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="aspect-video h-16 w-full object-cover"
              />
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          Banner size
          <select
            className="ml-2 rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-2 py-1 text-xs"
            value={bannerFormat}
            onChange={(e) =>
              setBannerFormat(e.target.value as AiBannerFormat)
            }
            disabled={disabled}
          >
            {(Object.keys(AI_BANNER_FORMAT_LABELS) as AiBannerFormat[]).map(
              (format) => (
                <option key={format} value={format}>
                  {AI_BANNER_FORMAT_LABELS[format]}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          Template
          <select
            className="ml-2 rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-2 py-1 text-xs"
            value={bannerTemplate}
            onChange={(e) =>
              setBannerTemplate(e.target.value as AiBannerTemplate)
            }
            disabled={disabled}
          >
            {(
              Object.keys(AI_BANNER_TEMPLATE_LABELS) as AiBannerTemplate[]
            ).map((template) => (
              <option key={template} value={template}>
                {AI_BANNER_TEMPLATE_LABELS[template]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          <input
            type="checkbox"
            checked={includeWatermark}
            onChange={(e) => setIncludeWatermark(e.target.checked)}
            disabled={disabled}
          />
          SellNearby watermark
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          <input
            type="checkbox"
            checked={includeStoreLogo}
            onChange={(e) => setIncludeStoreLogo(e.target.checked)}
            disabled={disabled}
          />
          Store logo
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => void run("image_enhance")}
        >
          {busyTask === "image_enhance"
            ? "Enhancing…"
            : `Enhance photo · ${formatAiMarketingTaskCostLabel("image_enhance")}`}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => void run("image_bg_remove")}
          title={
            quota && !quota.backgroundRemovalAvailable
              ? "Uses studio fallback locally until REMOVE_BG_API_KEY is set"
              : undefined
          }
        >
          {busyTask === "image_bg_remove"
            ? "Removing background…"
            : `Remove background · ${formatAiMarketingTaskCostLabel("image_bg_remove")}`}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => void run("banner_creator")}
        >
          {busyTask === "banner_creator"
            ? "Creating banner…"
            : `Create share banner · ${formatAiMarketingTaskCostLabel("banner_creator")}`}
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {notice && (
        <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {notice}
        </p>
      )}

      {result && (
        <div className="mt-3 space-y-2 rounded-md border border-[hsl(var(--dashboard-sidebar-border))] p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Result · {AI_MARKETING_TASK_LABELS[result.task]} ·{" "}
            {formatAiMarketingTaskCostLabel(result.task)}
            {result.bannerFormat
              ? ` · ${AI_BANNER_FORMAT_LABELS[result.bannerFormat]}`
              : ""}
            {result.bannerTemplate
              ? ` · ${AI_BANNER_TEMPLATE_LABELS[result.bannerTemplate]}`
              : ""}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveListingImageSrc(result.publicUrl, 1200)}
            alt="AI processed preview"
            className="max-h-64 w-full rounded-md object-contain bg-black/5"
          />
          {result.note && (
            <p className="text-xs text-amber-700">{result.note}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" asChild>
              <a
                href={resolveListingImageSrc(result.publicUrl, 1600)}
                target="_blank"
                rel="noreferrer"
                download
              >
                Download / open
              </a>
            </Button>
            {result.mayApplyToListing && (
              <Button
                type="button"
                size="sm"
                disabled={disabled}
                onClick={() => void applyToListing()}
              >
                {busyTask === "apply" ? "Applying…" : "Apply to listing"}
              </Button>
            )}
            {!result.mayApplyToListing && (
              <p className="self-center text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Marketing-only export — not added as a listing primary photo.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            AI image tools
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Enhance or remove background for listing use · banners are
            marketing-only exports
          </p>
        </div>
        {quota && (
          <p className="max-w-xs text-right text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            {formatAiMarketingQuotaSummary(quota)}
          </p>
        )}
      </div>
      <div className="mt-3">{body}</div>
    </div>
  );
}
