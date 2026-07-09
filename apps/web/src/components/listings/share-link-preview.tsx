'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { cn } from '@community-marketplace/ui';

function hostnameLabel(url: string | undefined): string {
  if (!url) return 'SELLNEARBY.IE';
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toUpperCase();
  } catch {
    return 'SELLNEARBY.IE';
  }
}

export interface ShareLinkPreviewProps {
  title: string;
  description: string;
  imageUrl: string;
  url?: string;
  className?: string;
}

/** WhatsApp / Facebook-style link card preview. */
export function ShareLinkPreview({
  title,
  description,
  imageUrl,
  url,
  className,
}: ShareLinkPreviewProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      <div>
        <p className="text-sm font-medium text-foreground">Link preview</p>
        <p className="text-xs text-muted-foreground">
          How WhatsApp, Facebook, and other apps show your listing link.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex gap-3 p-3">
          <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
            {!imageError ? (
              // eslint-disable-next-line @next/next/no-img-element -- OG preview uses dynamic API JPEG
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{title}</p>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{description}</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              {hostnameLabel(url)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
