'use client';

import { useEffect, useState } from 'react';

import type { DisplayAdPlacement, DisplayAdSlot } from '@community-marketplace/types';

import { DisplayAdPlacements, DisplayAdSlot as DisplayAdSlotView } from '@/components/ads/display-ad-slot';
import { adsService } from '@/services/ads.service';

interface DisplayAdsClientProps {
  context: string;
  /** When set, render only this placement from the context response. */
  placement?: DisplayAdPlacement;
  className?: string;
}

export function DisplayAdsClient({ context, placement, className }: DisplayAdsClientProps) {
  const [slots, setSlots] = useState<DisplayAdSlot[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void adsService.getPlacements(context).then((result) => {
      if (cancelled) return;
      setEnabled(result.enabled);
      const next = placement
        ? result.slots.filter((slot) => slot.placement === placement)
        : result.slots;
      setSlots(next);
    });
    return () => {
      cancelled = true;
    };
  }, [context, placement]);

  if (!enabled || slots.length === 0) return null;

  if (placement && slots.length === 1) {
    return (
      <div className={className} aria-label="Sponsored placement">
        <DisplayAdSlotView slot={slots[0]!} />
      </div>
    );
  }

  return (
    <section aria-label="Sponsored placements" className={className}>
      <DisplayAdPlacements slots={slots} className="flex flex-col gap-4" />
    </section>
  );
}
