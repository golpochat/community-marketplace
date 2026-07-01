import Link from 'next/link';
import Image from 'next/image';

import { APP_NAME, APP_SHORT_NAME } from '@community-marketplace/config';
import { cn } from '@community-marketplace/ui';

/** Beacon mark lockups (BRAND_MARK=beacon in config). Regenerate: pnpm brand:export */
const LOGO_HORIZONTAL = '/brand/sellnearby/svg/logo-horizontal-compact.svg';
const LOGO_DARK = '/brand/sellnearby/svg/logo-dark-mode-compact.svg';
const LOGO_AUTH = '/brand/sellnearby/svg/logo-auth.svg';
const LOGO_STACKED = '/brand/sellnearby/svg/logo-stacked.svg';
const ICON_MARK = '/brand/sellnearby/svg/icon-mark.svg';

const LOGO_ASPECT = 580 / 152;

const LOGO_SOURCES = {
  light: { src: LOGO_HORIZONTAL, aspect: LOGO_ASPECT },
  dark: { src: LOGO_DARK, aspect: LOGO_ASPECT },
  auth: { src: LOGO_AUTH, aspect: 360 / 320 },
  stacked: { src: LOGO_STACKED, aspect: 1 },
  icon: { src: ICON_MARK, aspect: 1 },
} as const;

/** Display heights in px — nav is 20% larger than the previous 44px default. */
const SIZE_CONFIG = {
  /** Footer — same lockup as header, slightly smaller */
  footer: { logoHeight: 38, logoClass: 'h-[2.375rem] w-auto' },
  /** Navbar + mobile menu — 44px × 1.2 ≈ 53px */
  nav: { logoHeight: 53, logoClass: 'h-[3.3125rem] w-auto' },
  /** Auth / onboarding centered lockup */
  auth: { logoHeight: 72, logoClass: 'h-[4.5rem] w-auto' },
  /** Sidebar icon-only mark */
  icon: { logoHeight: 32, logoClass: 'h-8 w-8' },
} as const;

interface LogoProps {
  className?: string;
  size?: keyof typeof SIZE_CONFIG;
  /** Logo lockup variant — light/dark horizontal, auth stacked, or icon mark only. */
  variant?: keyof typeof LOGO_SOURCES;
  /** Link target — defaults to home. Set for dashboard sidebar etc. */
  href?: string;
  /** When false, renders the mark without a link wrapper. */
  linked?: boolean;
}

export function Logo({
  className,
  size = 'nav',
  variant = 'light',
  href = '/',
  linked = true,
}: LogoProps) {
  const { logoHeight, logoClass } = SIZE_CONFIG[size] ?? SIZE_CONFIG.nav;
  const { src, aspect } = LOGO_SOURCES[variant];
  const logoWidth = Math.round(logoHeight * aspect);
  const darkSrc = LOGO_SOURCES.dark.src;

  const image =
    variant === 'light' ? (
      <>
        <Image
          src={src}
          alt={APP_SHORT_NAME}
          width={logoWidth}
          height={logoHeight}
          className={cn(logoClass, 'dark:hidden')}
          priority={size === 'nav'}
        />
        <Image
          src={darkSrc}
          alt={APP_SHORT_NAME}
          width={logoWidth}
          height={logoHeight}
          className={cn(logoClass, 'hidden dark:block')}
          priority={size === 'nav'}
        />
      </>
    ) : (
      <Image
        src={src}
        alt={APP_SHORT_NAME}
        width={logoWidth}
        height={logoHeight}
        className={logoClass}
        priority={size === 'nav'}
      />
    );

  if (!linked) {
    return (
      <span
        className={cn('inline-flex shrink-0 items-center', className)}
        aria-label={APP_NAME}
      >
        {image}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex shrink-0 items-center transition-opacity duration-150 hover:opacity-90',
        className,
      )}
      aria-label={`${APP_NAME} home`}
    >
      {image}
    </Link>
  );
}
