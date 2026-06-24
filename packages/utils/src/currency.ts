import { DEFAULT_CURRENCY } from '@community-marketplace/config/constants';
import { PLATFORM_LOCALE } from '@community-marketplace/config/platform';

export function formatCurrency(
  amount: number,
  currency = DEFAULT_CURRENCY,
  locale = PLATFORM_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number, locale = PLATFORM_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, locale = PLATFORM_LOCALE, digits = 1): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
