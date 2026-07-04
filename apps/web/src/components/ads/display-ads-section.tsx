import type { DisplayAdsPlacementsResponse } from '@community-marketplace/types';

import { DisplayAdPlacements } from '@/components/ads/display-ad-slot';
import { adsService } from '@/services/ads.service';

interface DisplayAdsSectionProps {
  context: string;
  className?: string;
}

export async function DisplayAdsSection({ context, className }: DisplayAdsSectionProps) {
  const placements = await adsService.getPlacements(context);

  if (!placements.enabled || placements.slots.length === 0) {
    return null;
  }

  return (
    <section aria-label="Sponsored placements" className={className}>
      <DisplayAdPlacements slots={placements.slots} className="flex flex-col gap-4" />
    </section>
  );
}

export type { DisplayAdsPlacementsResponse };
