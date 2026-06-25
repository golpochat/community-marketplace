import type { ListingPackageType } from '@community-marketplace/types';

export interface ListingPackageOption {
  value: ListingPackageType;
  label: string;
  description: string;
}

export const LISTING_PACKAGE_OPTIONS: ListingPackageOption[] = [
  { value: 'FREE', label: 'Free', description: '30 days' },
  { value: 'PAID_7D', label: '7-day boost', description: '7 days' },
  { value: 'PAID_30D', label: '30-day boost', description: '30 days' },
  { value: 'PAID_60D', label: '60-day boost', description: '60 days' },
  { value: 'PAID_90D', label: '90-day boost', description: '90 days' },
  {
    value: 'PREMIUM_UNTIL_SOLD',
    label: 'Premium',
    description: 'Up to 90 days or until sold',
  },
];
