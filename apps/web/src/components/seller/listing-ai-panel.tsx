"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@community-marketplace/ui";
import {
  AI_MARKETING_TASK_LABELS,
  formatAiMarketingQuotaSummary,
  formatAiMarketingTaskCostLabel,
  type AiMarketingQuotaSummary,
  type AiMarketingTask,
} from "@community-marketplace/types";

import { ApiClientError } from "@/lib/api-client";
import { useMarketingHubOptional } from "@/components/seller/marketing-hub/marketing-hub-context";
import type { ListingAiPreviewMap } from "@/lib/listing-form-draft";
import { aiMarketingService } from "@/services/ai-marketing.service";

interface ListingAiPanelProps {
  listingId?: string;
  title: string;
  description: string;
  categoryName?: string;
  condition?: string;
  location?: string;
  price?: string;
  hiddenTasks?: AiMarketingTask[];
  descriptionAcceptLabel?: string;
  /** listing = Accept into form; social = Copy only; all = both (legacy). */
  taskGroup?: "listing" | "social" | "all";
  /** When set, social tasks stay disabled until title length meets this. */
  requireTitleMinLength?: number;
  onAcceptTitle: (title: string) => void;
  onAcceptDescription: (description: string) => void;
  /** Restored AI outputs from create-listing draft (survives refresh). */
  initialPreviews?: ListingAiPreviewMap;
  /** Persist AI outputs so spent credits keep their text after refresh. */
  onPreviewsChange?: (previews: ListingAiPreviewMap) => void;
  /** When true, omit outer card/quota chrome (Marketing hub provides it). */
  embedded?: boolean;
}

const LISTING_TASKS: AiMarketingTask[] = ["seo_title", "description"];
const SOCIAL_TASKS: AiMarketingTask[] = [
  "keywords",
  "instagram_caption",
  "facebook_ad",
  "tiktok_script",
];
const OUTREACH_TASKS: AiMarketingTask[] = [
  "whatsapp_message",
  "email_campaign",
  "seasonal_promo",
];

function taskButtonLabel(task: AiMarketingTask, busy: boolean): string {
  if (busy) return "Generating…";
  const name = (() => {
    switch (task) {
      case "seo_title":
        return "AI SEO title";
      case "description":
        return "AI description";
      case "keywords":
        return "AI keywords";
      case "instagram_caption":
        return "AI Instagram";
      case "facebook_ad":
        return "AI Facebook";
      case "tiktok_script":
        return "AI TikTok script";
      case "whatsapp_message":
        return "AI WhatsApp";
      case "email_campaign":
        return "AI email";
      case "seasonal_promo":
        return "AI seasonal promo";
      default:
        return AI_MARKETING_TASK_LABELS[task];
    }
  })();
  return `${name} · ${formatAiMarketingTaskCostLabel(task)}`;
}

function pickRestoredPreview(
  previews: ListingAiPreviewMap | undefined,
  taskGroup: "listing" | "social" | "all",
  hidden: Set<AiMarketingTask>,
): { task: AiMarketingTask; text: string } | null {
  if (!previews) return null;
  const preferred =
    taskGroup === "listing"
      ? (["seo_title", "description"] as const)
      : taskGroup === "social"
        ? ([...SOCIAL_TASKS, ...OUTREACH_TASKS] as const)
        : ([
            "seo_title",
            "description",
            ...SOCIAL_TASKS,
            ...OUTREACH_TASKS,
          ] as const);
  for (const task of preferred) {
    if (hidden.has(task)) continue;
    const text = previews[task];
    if (typeof text === "string" && text.trim()) {
      return { task, text };
    }
  }
  return null;
}

export function ListingAiPanel({
  listingId,
  title,
  description,
  categoryName,
  condition,
  location,
  price,
  hiddenTasks = [],
  descriptionAcceptLabel = "Applied",
  taskGroup = "all",
  requireTitleMinLength,
  onAcceptTitle,
  onAcceptDescription,
  initialPreviews,
  onPreviewsChange,
  embedded = false,
}: ListingAiPanelProps) {
  const hub = useMarketingHubOptional();
  const [localQuota, setLocalQuota] = useState<AiMarketingQuotaSummary | null>(
    null,
  );
  const [loadingQuota, setLoadingQuota] = useState(!embedded);
  const [busyTask, setBusyTask] = useState<AiMarketingTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [previewsByTask, setPreviewsByTask] = useState<ListingAiPreviewMap>(
    () => initialPreviews ?? {},
  );
  const hidden = useMemo(() => new Set(hiddenTasks), [hiddenTasks]);
  const [preview, setPreview] = useState<{
    task: AiMarketingTask;
    text: string;
  } | null>(() => pickRestoredPreview(initialPreviews, taskGroup, new Set(hiddenTasks)));

  // Parent may hydrate draft previews after first paint — merge without wiping newer local keys.
  const initialPreviewsKey = JSON.stringify(initialPreviews ?? {});
  useEffect(() => {
    if (!initialPreviews || Object.keys(initialPreviews).length === 0) return;
    setPreviewsByTask((prev) => ({ ...initialPreviews, ...prev }));
    setPreview((current) => {
      if (current) return current;
      return pickRestoredPreview(
        initialPreviews,
        taskGroup,
        new Set(hiddenTasks),
      );
    });
    // Content key avoids re-running when parent passes a new object with the same map.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [initialPreviewsKey, taskGroup]);

  const quota = embedded ? hub?.quota ?? null : localQuota;
  const titleReady =
    requireTitleMinLength == null ||
    title.trim().length >= requireTitleMinLength;
  const socialLocked = taskGroup === "social" && !titleReady;

  const refreshQuota = useCallback(async () => {
    if (embedded) {
      await hub?.refreshQuota();
      return;
    }
    try {
      setLocalQuota(await aiMarketingService.getQuota());
    } catch {
      setLocalQuota(null);
    } finally {
      setLoadingQuota(false);
    }
  }, [embedded, hub]);

  useEffect(() => {
    if (embedded) return;
    void refreshQuota();
  }, [embedded, refreshQuota]);

  function commitPreviews(next: ListingAiPreviewMap) {
    setPreviewsByTask(next);
    onPreviewsChange?.(next);
  }

  if (!embedded && quota && (!quota.published || !quota.deployEnabled)) {
    return null;
  }

  async function runGenerate(task: AiMarketingTask) {
    if (socialLocked) return;
    setError(null);
    setCopyNotice(null);
    setBusyTask(task);
    try {
      const result = await aiMarketingService.generate({
        task,
        listingId,
        title: title || undefined,
        description: description || undefined,
        categoryName: categoryName || undefined,
        condition: condition || undefined,
        location: location || undefined,
        price: price || undefined,
      });
      const nextPreviews = {
        ...(initialPreviews ?? {}),
        ...previewsByTask,
        [result.task]: result.text,
      };
      commitPreviews(nextPreviews);
      setPreview({ task: result.task, text: result.text });
      // Apply listing fields immediately so create-draft persistence keeps paid text.
      if (result.task === "seo_title") {
        onAcceptTitle(result.text);
        setCopyNotice("SEO title applied above — edit anytime. Saved in this browser draft.");
      } else if (result.task === "description") {
        onAcceptDescription(result.text);
        setCopyNotice("Description applied above — edit anytime. Saved in this browser draft.");
      }
      if (embedded) {
        hub?.patchQuota({
          freeUnitsRemaining: result.freeUnitsRemaining,
          walletBalance: result.walletBalance,
        });
      } else {
        setLocalQuota((prev) =>
          prev
            ? {
                ...prev,
                freeUnitsRemaining: result.freeUnitsRemaining,
                walletBalance: result.walletBalance,
                freeUnitsUsedThisMonth:
                  prev.freeQuotaUnitsMonthly - result.freeUnitsRemaining,
              }
            : prev,
        );
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not generate text. Please try again.",
      );
    } finally {
      setBusyTask(null);
    }
  }

  const isListingApplyTask =
    preview?.task === "seo_title" || preview?.task === "description";

  function acceptPreview() {
    if (!preview) return;
    if (preview.task === "seo_title") onAcceptTitle(preview.text);
    else if (preview.task === "description") onAcceptDescription(preview.text);
  }

  async function copyPreview() {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview.text);
      setCopyNotice("Copied — paste into your message, email, or social post.");
    } catch {
      setError("Could not copy to clipboard. Select the text and copy manually.");
    }
  }

  const disabled =
    Boolean(busyTask) ||
    socialLocked ||
    quota?.enabled === false ||
    Boolean(embedded && hub?.disabled);

  function renderTaskButton(task: AiMarketingTask) {
    if (hidden.has(task)) return null;
    return (
      <Button
        key={task}
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        title={
          socialLocked
            ? `Add a title with at least ${requireTitleMinLength} characters first`
            : undefined
        }
        onClick={() => void runGenerate(task)}
      >
        {taskButtonLabel(task, busyTask === task)}
      </Button>
    );
  }

  const showListing = taskGroup === "listing" || taskGroup === "all";
  const showSocial = taskGroup === "social" || taskGroup === "all";

  const listingButtons = showListing
    ? LISTING_TASKS.map(renderTaskButton).filter(Boolean)
    : [];
  const socialButtons = showSocial
    ? SOCIAL_TASKS.map(renderTaskButton).filter(Boolean)
    : [];
  const outreachButtons = showSocial
    ? OUTREACH_TASKS.map(renderTaskButton).filter(Boolean)
    : [];

  const body = (
    <>
      {socialLocked && (
        <p className="mb-2 text-xs text-amber-800">
          Add a title (at least {requireTitleMinLength} characters) first so
          social posts match your item — or you will spend credits on generic
          copy.
        </p>
      )}
      <div className="space-y-2">
        {listingButtons.length > 0 && (
          <div className="flex flex-wrap gap-2">{listingButtons}</div>
        )}
        {socialButtons.length > 0 && (
          <div className="flex flex-wrap gap-2">{socialButtons}</div>
        )}
        {outreachButtons.length > 0 && (
          <div className="flex flex-wrap gap-2">{outreachButtons}</div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {copyNotice && (
        <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
          {copyNotice}
        </p>
      )}

      {preview && (
        <div className="mt-3 space-y-2 rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-white/50 p-3 dark:bg-black/10">
          <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
            Preview · {AI_MARKETING_TASK_LABELS[preview.task]} ·{" "}
            {formatAiMarketingTaskCostLabel(preview.task)}
          </p>
          <p className="whitespace-pre-wrap text-sm text-[hsl(var(--dashboard-main-fg))]">
            {preview.text}
          </p>
          <div className="flex flex-wrap gap-2">
            {isListingApplyTask ? (
              <Button type="button" size="sm" onClick={acceptPreview}>
                {preview.task === "description"
                  ? descriptionAcceptLabel === "Accept"
                    ? "Re-apply to field"
                    : descriptionAcceptLabel
                  : "Re-apply to field"}
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={() => void copyPreview()}>
                Copy
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => void runGenerate(preview.task)}
            >
              Regenerate · {formatAiMarketingTaskCostLabel(preview.task)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPreview(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
            Improve with AI
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Irish English · listing fields apply in-form · social/outreach
            copy-only
          </p>
        </div>
        {!loadingQuota && quota && (
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            {formatAiMarketingQuotaSummary(quota)}
          </p>
        )}
      </div>
      <div className="mt-3">{body}</div>
    </div>
  );
}
