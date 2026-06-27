'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { CashbackEstimate } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { Sparkles } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { monetizationService } from '@/services/monetization.service';

interface ListingCashbackCueProps {
  listingId: string;
}

export function ListingCashbackCue({ listingId }: ListingCashbackCueProps) {
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
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <div className="flex gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="space-y-1">
          {showPersonalized ? (
            <p>
              Pay by card and earn{' '}
              <strong>{formatCurrency(estimate.amount, 'EUR')}</strong> SellNearby Credit. Unlocks on{' '}
              {new Date(estimate.unlockAt).toLocaleDateString()}.
            </p>
          ) : (
            <p>
              Pay by card and earn <strong>{percent}%</strong> SellNearby Credit on eligible purchases.
            </p>
          )}
          <p className="text-xs text-emerald-800">
            Card payments only.{' '}
            <Link href="/buyer/wallet" className="font-medium underline hover:text-emerald-950">
              View your wallet
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
