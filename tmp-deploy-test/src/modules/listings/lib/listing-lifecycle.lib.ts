import type { ListingPackageType } from '@community-marketplace/types';

const PACKAGE_DURATION_DAYS: Record<ListingPackageType, number> = {
  FREE: 30,
  PAID_7D: 7,
  PAID_30D: 30,
  PAID_60D: 60,
  PAID_90D: 90,
  PREMIUM_UNTIL_SOLD: 90,
};

export function packageDurationDays(packageType: ListingPackageType): number {
  return PACKAGE_DURATION_DAYS[packageType];
}

export function computeExpiresAt(
  activatedAt: Date,
  packageType: ListingPackageType,
): Date {
  const days = packageDurationDays(packageType);
  const expires = new Date(activatedAt);
  expires.setDate(expires.getDate() + days);
  return expires;
}

export function isPaidPackage(packageType: ListingPackageType): boolean {
  return packageType !== 'FREE';
}

export const EXPIRY_WARNING_DAYS = 3;

export function daysUntilExpiry(expiresAt: Date, now = new Date()): number {
  const ms = expiresAt.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
