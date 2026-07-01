import type { InvoiceCompanyConfig } from '@community-marketplace/config';
import {
  APP_SHORT_NAME,
  BRAND_COLORS,
  formatInvoiceAddress,
  getInvoiceCompanyConfig,
} from '@community-marketplace/config';

export const PDF_PAGE = { width: 595.28, height: 841.89 } as const;
export const PDF_MARGIN = 48;

export const PDF_RGB = {
  primary: hexToRgb(BRAND_COLORS.primary),
  primaryDark: hexToRgb(BRAND_COLORS.primaryDark),
  accent: hexToRgb(BRAND_COLORS.accent),
  text: hexToRgb(BRAND_COLORS.textPrimary),
  muted: hexToRgb(BRAND_COLORS.textMuted),
  footer: hexToRgb(BRAND_COLORS.textFooter),
  border: hexToRgb(BRAND_COLORS.borderSubtle),
  surface: hexToRgb(BRAND_COLORS.surfacePage),
  white: [255, 255, 255] as [number, number, number],
  paidGreen: [22, 163, 74] as [number, number, number],
  paidGreenBg: [240, 253, 244] as [number, number, number],
};

export function getPdfCompany(config?: InvoiceCompanyConfig) {
  const company = config ?? getInvoiceCompanyConfig();
  return {
    ...company,
    displayName: company.legalName || APP_SHORT_NAME,
    formattedAddress: formatInvoiceAddress(company),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
