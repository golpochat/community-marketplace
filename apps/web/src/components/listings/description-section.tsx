import type { Listing } from '@community-marketplace/types';
import { resolveListingVehicleSpecs } from '@community-marketplace/utils';

import {
  ListingDescriptionBlock,
  ListingSpecsSection,
} from '@/components/listings/listing-specs-section';

interface DescriptionSectionProps {
  listing: Listing;
}

export function DescriptionSection({ listing }: DescriptionSectionProps) {
  const vehicleSpecs = resolveListingVehicleSpecs(listing);

  return (
    <div className="space-y-4">
      <ListingSpecsSection listing={listing} />
      {!vehicleSpecs && <ListingDescriptionBlock listing={listing} />}
    </div>
  );
}
