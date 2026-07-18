'use client';

import { cn } from '@community-marketplace/ui';
import { BadgeCheck } from 'lucide-react';

const SIZE_CLASS = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

export type VerifiedSellerIconSize = keyof typeof SIZE_CLASS;

interface VerifiedSellerIconProps {
  className?: string;
  size?: VerifiedSellerIconSize;
  /** Accessible name + native tooltip. */
  label?: string;
}

/** Platform-wide verified-seller mark — icon only, no text. */
export function VerifiedSellerIcon({
  className,
  size = 'md',
  label = 'Verified seller',
}: VerifiedSellerIconProps) {
  return (
    <span
      className={cn('inline-flex shrink-0 text-emerald-600', className)}
      title={label}
      aria-label={label}
      role="img"
    >
      <BadgeCheck className={SIZE_CLASS[size]} strokeWidth={2.25} aria-hidden />
    </span>
  );
}
