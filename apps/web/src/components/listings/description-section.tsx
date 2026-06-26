import type { Listing } from '@community-marketplace/types';
import { formatListingConditionLabel } from '@community-marketplace/utils';

import { ListingBadge } from '@/components/listings/listing-badge';
import {
  ListingDescriptionBlock,
  ListingSpecsSection,
} from '@/components/listings/listing-specs-section';

interface DescriptionSectionProps {
  listing: Listing;
}

export function DescriptionSection({ listing }: DescriptionSectionProps) {
  const hasStructuredVehicle =
    listing.attributes && Object.keys(listing.attributes).length > 0;
  const conditionLabel = formatListingConditionLabel(listing.condition);

  return (
    <div className="mt-4 space-y-4">
      {!hasStructuredVehicle && listing.category?.name && (
        <ListingBadge tone="outline">{listing.category.name}</ListingBadge>
      )}

      {conditionLabel && (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Condition:</span> {conditionLabel}
        </p>
      )}

      <ListingSpecsSection listing={listing} />
      <ListingDescriptionBlock listing={listing} />
    </div>
  );
}
