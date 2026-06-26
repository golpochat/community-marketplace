import { ListingBadge } from '@/components/listings/listing-badge';
import { cn } from '@community-marketplace/ui';
import { buildSaleBadgeLabel, listingHasSale } from '@community-marketplace/utils';
import { Tag } from 'lucide-react';

interface SaleBadgeOverlayProps {
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  className?: string;
}

export function SaleBadgeOverlay({
  originalPrice,
  salePrice,
  discountPercent,
  className,
}: SaleBadgeOverlayProps) {
  const hasSale = listingHasSale(originalPrice, salePrice, discountPercent);
  if (!hasSale || originalPrice == null || salePrice == null) return null;

  const savings = Math.round((originalPrice - salePrice) * 100) / 100;
  const label = buildSaleBadgeLabel(discountPercent, savings);

  return (
    <ListingBadge
      tone="sale"
      className={cn('absolute left-2 top-2 z-10 uppercase tracking-wide shadow-brand-sm', className)}
    >
      <Tag className="h-3 w-3" aria-hidden />
      {label}
    </ListingBadge>
  );
}
