/**
 * Canonical SellNearby brand tokens for email and server-rendered content.
 * Web UI uses CSS variables in apps/web/src/app/globals.css — keep primary hex in sync.
 */
export const BRAND_MARK = 'beacon' as const;

export type BrandMark = typeof BRAND_MARK;

export const BRAND_COLORS = {
  /** Teal primary — local beacon mark (#0D9488) */
  primary: '#0D9488',
  primaryLight: '#2DD4BF',
  primaryDark: '#0F766E',
  /** Warm coral — CTAs & wordmark accent (#F97316) */
  accent: '#F97316',
  accentDark: '#EA580C',
  trust: '#16A34A',
  textPrimary: '#1C1917',
  textMuted: '#78716C',
  textFooter: '#A8A29E',
  /** Text on dark teal surfaces (footer, header). */
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#CCFBF1',
  linkOnDark: '#99F6E4',
  surfacePage: '#FAFAFA',
  surfaceCard: '#FFFFFF',
  /** Light callout panel inside the email body. */
  surfaceCallout: '#F0FDFA',
  borderCallout: '#99F6E4',
  surfaceFooter: '#0F766E',
  borderSubtle: '#E4E4E7',
  borderOnDark: 'rgba(255,255,255,0.15)',
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
