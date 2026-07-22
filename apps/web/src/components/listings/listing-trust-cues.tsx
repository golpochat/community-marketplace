import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import { ShieldCheck } from 'lucide-react';

interface ListingTrustCuesProps {
  className?: string;
  /** Single-line cue for the detail sidebar (avoids duplicating a full banner). */
  compact?: boolean;
}

export function ListingTrustCues({ className, compact = false }: ListingTrustCuesProps) {
  if (compact) {
    return (
      <p className={cn('flex items-start gap-2 text-xs text-muted-foreground', className)}>
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          Verified sellers · secure messaging ·{' '}
          <Link href="/safety" className="font-medium text-primary hover:underline">
            Buyer protection
          </Link>
        </span>
      </p>
    );
  }

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Buyer protection
      </p>
      <p className="mb-3 text-sm text-muted-foreground">We verify sellers to keep your community safe.</p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Verified community marketplace
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
          Secure messaging
        </span>
        <Link
          href="/safety"
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-primary hover:underline"
        >
          Report suspicious listings
        </Link>
      </div>
    </div>
  );
}
