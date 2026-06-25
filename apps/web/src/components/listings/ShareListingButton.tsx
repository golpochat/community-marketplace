'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SharePlatform } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';

import { ListingQrCode } from '@/components/listings/ListingQrCode';
import { buildShareLinks, shareService } from '@/services/share.service';

interface ShareListingModalProps {
  listingId: string;
  title: string;
  open: boolean;
  onClose: () => void;
  variant?: 'button' | 'icon';
  className?: string;
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  );
}

export function ShareListingModal({
  listingId,
  title,
  open,
  onClose,
}: Pick<ShareListingModalProps, 'listingId' | 'title' | 'open' | 'onClose'>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState('');
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
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
    if (!navigator.share || !shortUrl) return;
    try {
      await navigator.share({ title, text: shareText, url: shortUrl });
      track('NATIVE');
      onClose();
    } catch {
      // cancelled
    }
  }, [shortUrl, shareText, title, track, onClose]);

  if (!open) return null;

  const links = shortUrl ? buildShareLinks(shortUrl, shareText, title) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-listing-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="share-listing-title" className="text-lg font-semibold text-gray-900">
            Share listing
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{title}</p>

        {loading && <p className="mt-6 text-sm text-gray-500">Preparing share link…</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {!loading && !error && shortUrl && links && (
          <div className="mt-6 space-y-4">
            <ListingQrCode
              shortUrl={shortUrl}
              title={title}
              onQrShare={() => track('QR')}
            />

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {shareText}
            </div>

            <div className="grid gap-1">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => void copyLink()}
              >
                {copied ? 'Link copied!' : 'Copy link'}
              </button>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => void nativeShare()}
                >
                  Share via device…
                </button>
              )}
              <a
                href={links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  track('WHATSAPP');
                  onClose();
                }}
              >
                WhatsApp
              </a>
              <a
                href={links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  track('FACEBOOK');
                  onClose();
                }}
              >
                Facebook
              </a>
              <a
                href={links.messenger}
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  track('MESSENGER');
                  onClose();
                }}
              >
                Messenger
              </a>
              <a
                href={links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  track('TELEGRAM');
                  onClose();
                }}
              >
                Telegram
              </a>
              <a
                href={links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  track('X');
                  onClose();
                }}
              >
                X (Twitter)
              </a>
              <a
                href={links.email}
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  track('EMAIL');
                  onClose();
                }}
              >
                Email
              </a>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  void copyLink();
                  track('INSTAGRAM');
                }}
              >
                Instagram (copy link to share)
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ShareListingButton({
  listingId,
  title,
  variant = 'button',
  className,
}: Omit<ShareListingModalProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }, []);

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-white hover:text-primary ${className ?? ''}`}
          aria-label="Share listing"
        >
          <ShareIcon className="h-4 w-4" />
        </button>
      ) : (
        <Button type="button" variant="outline" onClick={handleClick} className={className}>
          Share Listing
        </Button>
      )}
      <ShareListingModal
        listingId={listingId}
        title={title}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
