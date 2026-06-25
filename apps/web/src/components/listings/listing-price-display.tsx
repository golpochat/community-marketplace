import { DealBlock } from '@/components/listings/deal-block';

interface ListingPriceDisplayProps {
  price: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  currency: string;
  size?: 'sm' | 'card' | 'detail';
  className?: string;
  priceDroppedAt?: string;
  /** When false, discount badge is omitted (e.g. when SaleBadgeOverlay is on the image). */
  showBadge?: boolean;
}

export function ListingPriceDisplay({
  price,
  originalPrice,
  salePrice,
  discountPercent,
  currency,
  size = 'card',
  className,
  priceDroppedAt,
  showBadge,
}: ListingPriceDisplayProps) {
  const variant = size === 'detail' ? 'detail' : size === 'sm' ? 'inline' : 'card';

  return (
    <DealBlock
      price={price}
      originalPrice={originalPrice}
      salePrice={salePrice}
      discountPercent={discountPercent}
      currency={currency}
      variant={variant}
      showBadge={showBadge ?? variant === 'detail'}
      priceDroppedAt={priceDroppedAt}
      className={className}
    />
  );
}
