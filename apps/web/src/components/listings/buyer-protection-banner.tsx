import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import { ShieldAlert } from 'lucide-react';

interface BuyerProtectionBannerProps {
  /** Renders inside a parent card without its own outer shell. */
  embedded?: boolean;
}

export function BuyerProtectionBanner({ embedded = false }: BuyerProtectionBannerProps) {
  return (
    <div
      className={cn(
        'text-sm text-foreground',
        embedded
          ? 'rounded-lg border border-primary/15 bg-primary/5 p-3'
          : 'rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-brand-sm',
      )}
    >
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-2">
          <p className="font-medium text-foreground">Community buyer protection</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>We verify sellers and listings to keep your community safe.</li>
            <li>
              <Link href="/safety" className="font-medium text-primary hover:underline">
                Report suspicious listings instantly
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
