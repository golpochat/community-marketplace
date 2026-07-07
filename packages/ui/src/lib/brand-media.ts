/** Public web paths — served from apps/web/public/brand/sellnearby */
export const BRAND_ICON_MARK = '/brand/sellnearby/svg/icon-mark.svg';
export const BRAND_ICON_MARK_SUBTLE = '/brand/sellnearby/svg/icon-mark-subtle.svg';

export function resolveImageSrc(src?: string | null): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
}
