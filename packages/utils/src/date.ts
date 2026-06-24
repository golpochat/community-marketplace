import { PLATFORM_LOCALE } from '@community-marketplace/config/platform';

export function formatDate(
  value: string | Date,
  locale = PLATFORM_LOCALE,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(value: string | Date, locale = PLATFORM_LOCALE): string {
  return formatDate(value, locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatRelativeTime(value: string | Date, locale = PLATFORM_LOCALE): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return rtf.format(diffMinutes, 'minute');
    }
    return rtf.format(diffHours, 'hour');
  }

  return rtf.format(diffDays, 'day');
}

export function toIsoString(value: Date = new Date()): string {
  return value.toISOString();
}
