import { cn } from '@community-marketplace/ui';
import { buildSaleBadgeLabel, listingHasSale } from '@community-marketplace/utils';
import { Tag } from 'lucide-react';

interface SaleBadgeOverlayProps {
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SaleBadgeOverlay({
  originalPrice,
  salePrice,
  discountPercent,
  size = 'md',
  className,
}: SaleBadgeOverlayProps) {
  const hasSale = listingHasSale(originalPrice, salePrice, discountPercent);
  if (!hasSale || originalPrice == null || salePrice == null) return null;

  const savings = Math.round((originalPrice - salePrice) * 100) / 100;
  const label = buildSaleBadgeLabel(discountPercent, savings);

  return (
    <div
      className={cn(
        'absolute left-2 top-2 z-10 flex items-center gap-1 rounded-brand-sm bg-[hsl(var(--brand-secondary))] font-bold uppercase tracking-wide text-white shadow-brand-md',
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
        className,
      )}
    >
      <Tag
        className={cn(size === 'sm' && 'h-2.5 w-2.5', size === 'md' && 'h-3 w-3', size === 'lg' && 'h-4 w-4')}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
