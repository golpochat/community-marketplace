/**
 * Canonical SellNearby brand tokens for email and server-rendered content.
 * Web UI uses CSS variables in apps/web/src/app/globals.css — keep primary hex in sync.
 */
export const BRAND_COLORS = {
  /** Matches --brand-primary (225 100% 61%) */
  primary: '#3366FF',
  primaryDark: '#2952CC',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  textFooter: '#9CA3AF',
  surfacePage: '#F3F4F6',
  surfaceCard: '#FFFFFF',
  surfaceFooter: '#F9FAFB',
  borderSubtle: '#E5E7EB',
  white: '#FFFFFF',
} as const;

export type BrandColors = typeof BRAND_COLORS;

/** Role codes that cannot be assigned via admin invitation. */
export const NON_INVITEABLE_ROLE_CODES = ['SUPER_ADMIN', 'SELLER', 'BUYER'] as const;

export function isInviteableRoleCode(code: string): boolean {
  return !(NON_INVITEABLE_ROLE_CODES as readonly string[]).includes(code);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function emailFontStack(): string {
  return "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
}
