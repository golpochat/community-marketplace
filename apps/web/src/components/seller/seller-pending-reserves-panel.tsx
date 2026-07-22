'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import type { ListingReserve } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import { useAppFeedback } from '@community-marketplace/ui';

import { useCountdownLabel } from '@/hooks/use-countdown-label';
import { listingReservesService } from '@/services/listing-reserves.service';

interface SellerPendingReservesPanelProps {
  onChanged?: () => void;
}

function PendingRow({
  item,
  actionId,
  onApprove,
  onDecline,
}: {
  item: ListingReserve;
  actionId: string | null;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const countdown = useCountdownLabel(item.pendingExpiresAt);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200/80 bg-white/70 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {item.listingTitle ?? 'Listing'}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.buyerDisplayName ?? item.buyerEmail ?? 'Buyer'}
          {countdown && countdown !== 'ended'
            ? ` · expires in ${countdown}`
            : ' · respond soon'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/account/listings/${item.listingId}/edit`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View listing
        </Link>
        <Button
          type="button"
          size="sm"
          disabled={actionId === item.id}
          onClick={onApprove}
        >
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={actionId === item.id}
          onClick={onDecline}
        >
          Decline
        </Button>
      </div>
    </li>
  );
}

export function SellerPendingReservesPanel({ onChanged }: SellerPendingReservesPanelProps) {
  const feedback = useAppFeedback();
  const [items, setItems] = useState<ListingReserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listingReservesService.listPending();
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(reserveId: string, action: 'approve' | 'decline') {
    setActionId(reserveId);
    try {
      if (action === 'approve') {
        await listingReservesService.approve(reserveId);
        feedback.success('Reservation approved', 'The listing is now reserved for that buyer.');
      } else {
        await listingReservesService.decline(reserveId);
        feedback.success('Reservation declined', 'The listing stays available.');
      }
      await load();
      onChanged?.();
    } catch (err) {
      feedback.error(
        'Could not update reservation',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setActionId(null);
    }
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
      <h3 className="text-sm font-semibold text-amber-950">Pending reservation requests</h3>
      <p className="mt-1 text-xs text-amber-900/80">
        Approve to hold the listing for the buyer, or decline to keep it open.
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <PendingRow
            key={item.id}
            item={item}
            actionId={actionId}
            onApprove={() => void run(item.id, 'approve')}
            onDecline={() => void run(item.id, 'decline')}
          />
        ))}
      </ul>
    </div>
  );
}
