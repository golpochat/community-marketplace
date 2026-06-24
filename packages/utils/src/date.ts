export function formatDate(
  value: string | Date,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(value: string | Date, locale = 'en-US'): string {
  return formatDate(value, locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatRelativeTime(value: string | Date, locale = 'en-US'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ];

  let duration = diffSec;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return rtf.format(0, 'second');
}

export function toIsoString(value: Date = new Date()): string {
  return value.toISOString();
}
