'use client';

import { cn } from '@community-marketplace/ui';
import { MessageSquare, ShieldCheck } from 'lucide-react';

interface ListingCardTrustRowProps {
  className?: string;
}

export function ListingCardTrustRow({ className }: ListingCardTrustRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-[11px] text-gray-400', className)}>
      <span className="inline-flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" aria-hidden />
        Safe marketplace
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="h-3 w-3" aria-hidden />
        Secure messaging
      </span>
    </div>
  );
}
