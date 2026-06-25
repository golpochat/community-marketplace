import Link from 'next/link';

import { APP_NAME } from '@community-marketplace/config';
import { cn } from '@community-marketplace/ui';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <Link
      href="/"
      className={cn('group flex items-center gap-2.5 transition-opacity hover:opacity-90', className)}
      aria-label={`${APP_NAME} home`}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-brand-md bg-primary text-primary-foreground shadow-brand-sm',
          iconSize,
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 15h12M8 9h8M10 6h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="18" r="1.25" fill="currentColor" />
        </svg>
      </span>
      {showText ? (
        <span className={cn('font-semibold text-primary', textSize)}>{APP_NAME}</span>
      ) : null}
    </Link>
  );
}
