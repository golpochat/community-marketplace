export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function slugify(text: string): string {
  if (!isNonEmptyString(text)) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number, suffix = '…'): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - suffix.length).trimEnd()}${suffix}`;
}

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getInitials(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
