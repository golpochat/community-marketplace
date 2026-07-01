'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';

import type { SharePlatform } from '@community-marketplace/types';
import { Button, cn } from '@community-marketplace/ui';

import { ListingQrCode } from '@/components/listings/ListingQrCode';
import {
  extractShareSubtitle,
  SHARE_MORE_PLATFORMS,
  SHARE_PRIMARY_PLATFORMS,
  type SharePlatformAction,
} from '@/lib/share-platform-config';
import { buildShareLinks, shareService } from '@/services/share.service';

interface ShareListingModalProps {
  listingId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-sm font-medium text-foreground"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function PlatformButton({
  action,
  onActivate,
}: {
  action: SharePlatformAction;
  onActivate: () => void;
}) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={onActivate}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center transition-colors duration-150 hover:border-primary/30 hover:bg-primary/5"
    >
      <Icon className="h-5 w-5 text-primary" aria-hidden />
      <span className="text-xs font-medium text-foreground">{action.label}</span>
    </button>
  );
}

export function ShareListingModal({ listingId, title, open, onClose }: ShareListingModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState('');
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const supportsNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!open) {
      setShowMore(false);
      setShowPreview(false);
      setShowQr(false);
      setCopied(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void shareService
      .shorten(listingId)
      .then((result) => {
        if (cancelled) return;
        setShortUrl(result.shortUrl);
        setShareText(result.shareText);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load share link');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, listingId]);

  const track = useCallback(
    (platform: SharePlatform) => {
      shareService.track(listingId, platform);
    },
    [listingId],
  );

  const copyLink = useCallback(async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      track('COPY_LINK');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [shortUrl, track]);

  const nativeShare = useCallback(async () => {
    if (!supportsNativeShare || !shortUrl) return;
    try {
      await navigator.share({ title, text: shareText, url: shortUrl });
      track('NATIVE');
      onClose();
    } catch {
      // User cancelled share sheet.
    }
  }, [supportsNativeShare, shortUrl, shareText, title, track, onClose]);

  const handlePlatform = useCallback(
    async (action: SharePlatformAction, links: ReturnType<typeof buildShareLinks>) => {
      if (action.kind === 'copy') {
        await copyLink();
        if (action.id === 'INSTAGRAM') track('INSTAGRAM');
        return;
      }

      track(action.id);
      if (action.external) {
        window.open(action.href(links), '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = action.href(links);
      }
      onClose();
    },
    [copyLink, onClose, track],
  );

  if (!open || typeof document === 'undefined') return null;

  const links = shortUrl ? buildShareLinks(shortUrl, shareText, title) : null;
  const subtitle = shareText ? extractShareSubtitle(shareText) : undefined;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close share dialog"
        onClick={onClose}
      />
      <div
        className="relative z-[101] flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-card shadow-xl sm:max-w-sm sm:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-listing-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="share-listing-title" className="text-base font-semibold text-foreground">
              Share listing
            </h2>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{title}</p>
            {subtitle && subtitle !== title && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {loading && <p className="text-sm text-muted-foreground">Preparing share link…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && shortUrl && links && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2">
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{shortUrl}</span>
                <Button type="button" size="sm" variant="outline" onClick={() => void copyLink()}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {supportsNativeShare && (
                <Button type="button" className="w-full" onClick={() => void nativeShare()}>
                  Share via device
                </Button>
              )}

              <div className="grid grid-cols-3 gap-2">
                {SHARE_PRIMARY_PLATFORMS.map((action) => (
                  <PlatformButton
                    key={action.id}
                    action={action}
                    onActivate={() => void handlePlatform(action, links)}
                  />
                ))}
              </div>

              <CollapsibleSection
                label="More apps"
                open={showMore}
                onToggle={() => setShowMore((value) => !value)}
              >
                <div className="grid grid-cols-4 gap-2">
                  {SHARE_MORE_PLATFORMS.map((action) => (
                    <PlatformButton
                      key={action.id}
                      action={action}
                      onActivate={() => void handlePlatform(action, links)}
                    />
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                label="Preview message"
                open={showPreview}
                onToggle={() => setShowPreview((value) => !value)}
              >
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap">
                  {shareText}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                label="QR code"
                open={showQr}
                onToggle={() => setShowQr((value) => !value)}
              >
                <ListingQrCode
                  shortUrl={shortUrl}
                  title={title}
                  compact
                  onQrShare={() => track('QR')}
                />
              </CollapsibleSection>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
