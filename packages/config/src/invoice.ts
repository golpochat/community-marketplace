/**
 * Configurable company / tax details for invoices, receipts, and statements.
 * Override via INVOICE_* environment variables without code changes.
 */

export type InvoiceVatStatus = 'not_registered' | 'registered';

export interface InvoiceCompanyConfig {
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  eircode: string;
  country: string;
  companyRegNumber: string;
  vatNumber: string;
  vatStatus: InvoiceVatStatus;
  /** Ireland standard rate — used when vatStatus is `registered`. */
  defaultVatRate: number;
  /** Platform SKUs are stored and displayed VAT-inclusive when true. */
  pricesIncludeVat: boolean;
  supportEmail: string;
  website: string;
  logoHeaderFile: string;
  logoFooterFile: string;
}

export const DEFAULT_INVOICE_COMPANY: InvoiceCompanyConfig = {
  legalName: 'SellNearby',
  addressLine1: 'Friarsland Crescent, Roebuck Road',
  addressLine2: 'Dublin 14',
  eircode: 'D14X289',
  country: 'Ireland',
  companyRegNumber: '',
  vatNumber: '',
  vatStatus: 'not_registered',
  defaultVatRate: 0.23,
  pricesIncludeVat: true,
  supportEmail: 'support@sellnearby.ie',
  website: 'https://sellnearby.ie',
  logoHeaderFile: 'logo-monochrome-white.png',
  logoFooterFile: 'logo-horizontal-full.png',
};

export function formatInvoiceAddress(config: InvoiceCompanyConfig): string {
  return [config.addressLine1, config.addressLine2, config.eircode, config.country]
    .filter(Boolean)
    .join(', ');
}

export function getInvoiceCompanyConfig(
  overrides: Partial<InvoiceCompanyConfig> = {},
): InvoiceCompanyConfig {
  const vatStatusRaw = (
    overrides.vatStatus ??
    process.env.INVOICE_VAT_STATUS ??
    DEFAULT_INVOICE_COMPANY.vatStatus
  ).toLowerCase();

  const vatStatus: InvoiceVatStatus =
    vatStatusRaw === 'registered' ? 'registered' : 'not_registered';

  return {
    legalName:
      overrides.legalName ??
      process.env.INVOICE_LEGAL_NAME ??
      DEFAULT_INVOICE_COMPANY.legalName,
    addressLine1:
      overrides.addressLine1 ??
      process.env.INVOICE_ADDRESS_LINE1 ??
      DEFAULT_INVOICE_COMPANY.addressLine1,
    addressLine2:
      overrides.addressLine2 ??
      process.env.INVOICE_ADDRESS_LINE2 ??
      DEFAULT_INVOICE_COMPANY.addressLine2,
    eircode:
      overrides.eircode ?? process.env.INVOICE_EIRCODE ?? DEFAULT_INVOICE_COMPANY.eircode,
    country:
      overrides.country ?? process.env.INVOICE_COUNTRY ?? DEFAULT_INVOICE_COMPANY.country,
    companyRegNumber:
      overrides.companyRegNumber ??
      process.env.INVOICE_COMPANY_REG_NUMBER ??
      DEFAULT_INVOICE_COMPANY.companyRegNumber,
    vatNumber:
      overrides.vatNumber ?? process.env.INVOICE_VAT_NUMBER ?? DEFAULT_INVOICE_COMPANY.vatNumber,
    vatStatus,
    defaultVatRate: overrides.defaultVatRate ?? DEFAULT_INVOICE_COMPANY.defaultVatRate,
    pricesIncludeVat: overrides.pricesIncludeVat ?? DEFAULT_INVOICE_COMPANY.pricesIncludeVat,
    supportEmail:
      overrides.supportEmail ??
      process.env.INVOICE_SUPPORT_EMAIL ??
      process.env.EMAIL_FROM?.replace(/^no-reply@/, 'support@') ??
      DEFAULT_INVOICE_COMPANY.supportEmail,
    website:
      overrides.website ??
      process.env.INVOICE_WEBSITE?.replace(/\/$/, '') ??
      (process.env.WEB_APP_URL?.includes('localhost')
        ? DEFAULT_INVOICE_COMPANY.website
        : process.env.WEB_APP_URL?.replace(/\/$/, '')) ??
      DEFAULT_INVOICE_COMPANY.website,
    logoHeaderFile: overrides.logoHeaderFile ?? DEFAULT_INVOICE_COMPANY.logoHeaderFile,
    logoFooterFile: overrides.logoFooterFile ?? DEFAULT_INVOICE_COMPANY.logoFooterFile,
  };
}

export interface VatBreakdown {
  net: number;
  vat: number;
  gross: number;
}

/** Split a VAT-inclusive gross amount into net + VAT (invoice-level rounding). */
export function splitVatFromGross(gross: number, vatRate: number): VatBreakdown {
  const net = Math.round((gross / (1 + vatRate)) * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;
  return { net, vat, gross };
}

export function formatInvoiceMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export interface InvoiceTotalsLine {
  label: string;
  value: string;
  emphasis?: boolean;
}

export function buildPlatformInvoiceTotals(
  gross: number,
  currency: string,
  config: InvoiceCompanyConfig = getInvoiceCompanyConfig(),
): InvoiceTotalsLine[] {
  if (config.vatStatus === 'registered' && config.vatNumber) {
    const { net, vat } = splitVatFromGross(gross, config.defaultVatRate);
    const vatPercent = Math.round(config.defaultVatRate * 100);
    return [
      { label: 'Net amount', value: formatInvoiceMoney(net, currency) },
      { label: `VAT @ ${vatPercent}%`, value: formatInvoiceMoney(vat, currency) },
      {
        label: 'Total (incl. VAT)',
        value: formatInvoiceMoney(gross, currency),
        emphasis: true,
      },
    ];
  }

  return [
    { label: 'Amount due', value: formatInvoiceMoney(gross, currency), emphasis: true },
    { label: 'VAT', value: 'Not applicable' },
  ];
}

export function buildPlatformInvoiceVatNote(config: InvoiceCompanyConfig = getInvoiceCompanyConfig()): string {
  if (config.vatStatus === 'registered' && config.vatNumber) {
    return `VAT registration number: ${config.vatNumber}. VAT is included in the total shown above where applicable.`;
  }
  return 'SellNearby is not currently registered for VAT. No VAT has been charged on this invoice.';
}

export function buildPlatformRevenueReportVatNote(
  config: InvoiceCompanyConfig = getInvoiceCompanyConfig(),
): string {
  if (config.vatStatus === 'registered' && config.vatNumber) {
    return `VAT registration number: ${config.vatNumber}. VAT breakdown on platform revenue applies to SellNearby supplies only.`;
  }
  return 'SellNearby is not currently registered for VAT. This report summarises gross platform revenue; individual SN-INV invoices remain the primary billing records.';
}

export function buildPlatformRevenueReportNote(
  config: InvoiceCompanyConfig = getInvoiceCompanyConfig(),
): string {
  return [
    'This report summarises SellNearby platform revenue for the period shown: direct platform service invoices and marketplace commission on listing sales.',
    'Use individual SN-INV invoices and payment records as supporting audit evidence.',
    'Buyer and seller activity sections, when included, show marketplace trade volume only and are not platform income.',
    buildPlatformRevenueReportVatNote(config),
  ].join(' ');
}

export function buildPlatformInvoiceNote(config: InvoiceCompanyConfig = getInvoiceCompanyConfig()): string {
  return [
    'Thank you for your payment. This invoice is for platform services provided by SellNearby.',
    'Payment was collected electronically at checkout.',
    buildPlatformInvoiceVatNote(config),
  ].join(' ');
}

export function buildBuyerReceiptNote(config: InvoiceCompanyConfig = getInvoiceCompanyConfig()): string {
  return [
    'This receipt confirms payment processed through SellNearby for the listing described above.',
    'It is not a VAT invoice for the underlying goods or services unless separately issued by the seller.',
    `Questions: ${config.supportEmail}`,
  ].join(' ');
}

export function buildSellerSalesRecordNote(config: InvoiceCompanyConfig = getInvoiceCompanyConfig()): string {
  return [
    'This record summarises a completed buyer payment for your listing on SellNearby.',
    'Payout timing depends on your Stripe Connect account. Tax obligations on your sale remain with you as the seller.',
    `Questions: ${config.supportEmail}`,
  ].join(' ');
}

export function buildStatementNote(role: 'seller' | 'buyer'): string {
  if (role === 'seller') {
    return 'This statement is a summary of activity on your SellNearby seller account for the period shown. It does not replace individual invoices or receipts. Payout timing follows your Stripe Connect account; amounts marked as pending settlement may not yet have reached your bank.';
  }
  return 'This statement is a summary of your purchases on SellNearby for the period shown. It does not replace individual payment receipts.';
}

export function resolveDocumentWebsite(config: InvoiceCompanyConfig = getInvoiceCompanyConfig()): string {
  const website = config.website.trim();
  if (!website || website.includes('localhost') || website.includes('127.0.0.1')) {
    return DEFAULT_INVOICE_COMPANY.website;
  }
  return website;
}

export function splitFooterLegalSentences(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.endsWith('.') ? part : `${part}.`));
}

/**
 * Short footer legal line for enterprise PDFs.
 * Full VAT / purpose notes stay in the document body note box.
 */
export function buildDocumentFooterLegal(
  kind:
    | 'platform_invoice'
    | 'platform_revenue_report'
    | 'buyer_receipt'
    | 'seller_sales_record'
    | 'statement',
  config: InvoiceCompanyConfig = getInvoiceCompanyConfig(),
): string {
  const name = config.legalName;
  switch (kind) {
    case 'platform_invoice':
      return `${name} · Platform services invoice · Generated electronically · Valid without signature.`;
    case 'platform_revenue_report':
      return `${name} · Internal platform revenue report · Generated electronically · Valid without signature.`;
    case 'buyer_receipt':
      return `${name} · Payment facilitation document · Generated electronically · Valid without signature.`;
    case 'seller_sales_record':
      return `${name} · Seller sales summary · Generated electronically · Valid without signature.`;
    case 'statement':
      return `${name} · Period activity summary · Generated electronically · Valid without signature.`;
    default:
      return `${name} · Generated electronically · Valid without signature.`;
  }
}

/** Default price (VAT-inclusive) for a buyer purchase-history statement unlock. */
export const DEFAULT_BUYER_STATEMENT_PRICE_EUR = 0.99;
