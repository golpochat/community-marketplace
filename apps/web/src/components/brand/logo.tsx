import Link from 'next/link';
import Image from 'next/image';

import { APP_NAME, APP_SHORT_NAME } from '@community-marketplace/config';
import { cn } from '@community-marketplace/ui';

/** Horizontal lockup — icon + SellNearby (560×152 viewBox). */
const LOGO_HORIZONTAL = '/brand/sellnearby/svg/logo-horizontal-compact.svg';
const LOGO_DARK = '/brand/sellnearby/svg/logo-dark-mode.svg';

const LOGO_ASPECT = 560 / 152;

const LOGO_SOURCES = {
  light: { src: LOGO_HORIZONTAL, aspect: LOGO_ASPECT },
  dark: { src: LOGO_DARK, aspect: 640 / 160 },
} as const;

/** Display heights in px — nav is 20% larger than the previous 44px default. */
const SIZE_CONFIG = {
  /** Footer — same lockup as header, slightly smaller */
  footer: { logoHeight: 38, logoClass: 'h-[2.375rem] w-auto' },
  /** Navbar + mobile menu — 44px × 1.2 ≈ 53px */
  nav: { logoHeight: 53, logoClass: 'h-[3.3125rem] w-auto' },
} as const;

interface LogoProps {
  className?: string;
  size?: keyof typeof SIZE_CONFIG;
  /** Use dark-mode wordmark (white text) on dark backgrounds. */
  variant?: 'light' | 'dark';
}

export function Logo({ className, size = 'nav', variant = 'light' }: LogoProps) {
  const { logoHeight, logoClass } = SIZE_CONFIG[size];
  const { src, aspect } = LOGO_SOURCES[variant];
  const logoWidth = Math.round(logoHeight * aspect);

  return (
    <Link
      href="/"
      className={cn('group inline-flex shrink-0 items-center transition-opacity hover:opacity-90', className)}
      aria-label={`${APP_NAME} home`}
    >
      <Image
        src={src}
        alt={APP_SHORT_NAME}
        width={logoWidth}
        height={logoHeight}
        className={logoClass}
        priority={size === 'nav'}
      />
    </Link>
  );
}
