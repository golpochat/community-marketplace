/** First segment of a comma-separated location label (e.g. "Goatstown, Dublin" → "Goatstown"). */
export function extractPrimaryAreaName(locationLabel: string): string {
  const trimmed = locationLabel.trim();
  if (!trimmed) return trimmed;
  const [primary] = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  return primary ?? trimmed;
}

export function normalizeAreaSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function areaNamesMatch(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function resolveCommunityLabel(locationLabel?: string): string | undefined {
  const primary = extractPrimaryAreaName(locationLabel ?? '');
  if (!primary) return undefined;
  return `${primary} Community`;
}

export const DEFAULT_NEARBY_RADIUS_KM = 10;
export const EXPANDED_NEARBY_RADIUS_KM = 20;
