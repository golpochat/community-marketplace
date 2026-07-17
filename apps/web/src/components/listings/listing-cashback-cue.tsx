'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { CashbackEstimate } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';
import { Sparkles } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { monetizationService } from '@/services/monetization.service';

interface ListingCashbackCueProps {
  listingId: string;
  embedded?: boolean;
}

export function ListingCashbackCue({ listingId, embedded = false }: ListingCashbackCueProps) {
  const { isAuthenticated } = useAuth();
  const [estimate, setEstimate] = useState<CashbackEstimate | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setEstimate(null);
      return;
    }
    void monetizationService
      .estimateCashback(listingId)
      .then(setEstimate)
      .catch(() => setEstimate(null));
  }, [isAuthenticated, listingId]);

  const showPersonalized = estimate?.eligible;
  const percent = estimate?.cashbackPercent ?? 1.5;

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
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          {showPersonalized ? (
            <p className="text-foreground">
              Pay by card and earn{' '}
              <strong>{formatCurrency(estimate.amount, 'EUR')}</strong> SellNearby Credit. Unlocks on{' '}
              {new Date(estimate.unlockAt).toLocaleDateString()}.
            </p>
          ) : (
            <p className="text-foreground">
              Pay by card and earn <strong>{percent}%</strong> SellNearby Credit on eligible purchases.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Card payments only.{' '}
            <Link href="/account/wallet" className="font-medium text-primary hover:underline">
              View your wallet
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
