import { ListingBadge } from '@/components/listings/listing-badge';
import { cn } from '@community-marketplace/ui';
import { buildSaleBadgeLabel, formatCurrency, isFreeListingPrice, listingHasSale } from '@community-marketplace/utils';
import { ArrowDown, Tag } from 'lucide-react';

export interface DealBlockProps {
  price: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  currency: string;
  variant?: 'card' | 'detail' | 'inline';
  showBadge?: boolean;
  priceDroppedAt?: string;
  className?: string;
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

function FreePriceDisplay({
  variant,
  className,
}: {
  variant: DealBlockProps['variant'];
  className?: string;
}) {
  return (
    <ListingBadge
      tone="free"
      className={cn(
        variant === 'detail' && 'px-4 py-2 text-lg',
        variant === 'card' && 'text-base',
        variant === 'inline' && 'text-sm',
        className,
      )}
    >
      FREE
    </ListingBadge>
  );
}

export function DealBlock({
  price,
  originalPrice,
  salePrice,
  discountPercent,
  currency,
  variant = 'card',
  showBadge = true,
  priceDroppedAt,
  className,
}: DealBlockProps) {
  if (isFreeListingPrice(price)) {
    return <FreePriceDisplay variant={variant} className={className} />;
  }

  const hasSale = listingHasSale(originalPrice, salePrice, discountPercent);

  if (!hasSale || originalPrice == null || salePrice == null || discountPercent == null) {
    return (
      <p
        className={cn(
          'font-bold text-primary',
          variant === 'detail' && 'text-3xl',
          variant === 'card' && 'mt-1 text-lg',
          variant === 'inline' && 'text-sm',
          className,
        )}
      >
        {formatCurrency(price, currency)}
      </p>
    );
  }

  const savingsAmount = Math.round((originalPrice - salePrice) * 100) / 100;
  const badgeLabel = buildSaleBadgeLabel(discountPercent, savingsAmount);
  const droppedDays = priceDroppedAt ? daysSince(priceDroppedAt) : null;

  return (
    <div className={cn('space-y-2', className)}>
      {showBadge && (
        <div className="flex flex-wrap items-center gap-2">
          <ListingBadge tone="sale">
            <Tag className="mr-1 h-3 w-3" aria-hidden />
            {badgeLabel}
          </ListingBadge>
        </div>
      )}

      <div className="flex flex-wrap items-baseline gap-2">
        <span
          className={cn(
            'font-bold text-primary',
            variant === 'detail' && 'text-3xl',
            variant === 'card' && 'text-lg',
            variant === 'inline' && 'text-sm',
          )}
        >
          {formatCurrency(salePrice, currency)}
        </span>
        <span
          className={cn(
            'text-muted-foreground/70 line-through',
            variant === 'detail' && 'text-lg',
            variant === 'card' && 'text-sm',
            variant === 'inline' && 'text-xs',
          )}
        >
          {formatCurrency(originalPrice, currency)}
        </span>
      </div>

      {savingsAmount > 0 && (
        <p
          className={cn(
            'flex items-center gap-1 font-medium text-[hsl(var(--brand-accent))]',
            variant === 'detail' && 'text-sm',
            variant === 'card' && 'text-xs',
            variant === 'inline' && 'text-xs',
          )}
        >
          <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          You save {formatCurrency(savingsAmount, currency)}
        </p>
      )}

      {droppedDays != null && droppedDays > 0 && variant === 'detail' && (
        <p className="text-xs text-muted-foreground">
          Price dropped {droppedDays} day{droppedDays === 1 ? '' : 's'} ago
        </p>
      )}
    </div>
  );
}

/** One-line pricing text for share previews and notifications. */
export function formatDealShareLine(
  title: string,
  price: number,
  currency: string,
  originalPrice?: number,
  salePrice?: number,
  discountPercent?: number,
): string {
  if (isFreeListingPrice(price)) {
    return `${title} — FREE`;
  }
  const hasSale = listingHasSale(originalPrice, salePrice, discountPercent);
  if (hasSale && originalPrice != null && salePrice != null) {
    const savings = Math.round((originalPrice - salePrice) * 100) / 100;
    const badge = discountPercent != null ? buildSaleBadgeLabel(discountPercent, savings) : 'SALE';
    return `${title} — ${formatCurrency(salePrice, currency)} (${badge}, was ${formatCurrency(originalPrice, currency)})`;
  }
  return `${title} — ${formatCurrency(price, currency)}`;
}
