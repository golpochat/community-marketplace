import { Badge } from '@community-marketplace/ui';
import type { Listing, ListingCondition } from '@community-marketplace/types';

import { ListingPriceDisplay } from '@/components/listings/listing-price-display';

interface DescriptionSectionProps {
  listing: Listing;
}

function formatCondition(condition: ListingCondition): string {
  return condition.replace('_', ' ');
}

export function DescriptionSection({ listing }: DescriptionSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {formatCondition(listing.condition)}
        </Badge>
        <span className="text-sm text-gray-500">{listing.location.label}</span>
      </div>
      <ListingPriceDisplay
        price={listing.price}
        originalPrice={listing.originalPrice}
        salePrice={listing.salePrice}
        discountPercent={listing.discountPercent}
        currency={listing.currency}
        size="detail"
      />
      <div className="prose prose-sm max-w-none text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        <p className="whitespace-pre-wrap">{listing.description}</p>
      </div>
      <div className="flex gap-4 text-sm text-gray-500">
        <span>{listing.viewCount} views</span>
        <span>{listing.favoriteCount} saves</span>
      </div>
    </div>
  );
}
