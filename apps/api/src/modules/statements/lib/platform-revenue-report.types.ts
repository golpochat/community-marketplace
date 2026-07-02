import type { FinanceRecordLine } from './finance-records.util';

export interface PlatformRevenueInvoiceLine {
  date: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  serviceLabel: string;
  gross: number;
  currency: string;
}

export interface MarketplaceFeeLine {
  date: string;
  receiptRef: string;
  listingTitle: string;
  sellerName: string;
  sellerEmail: string;
  fee: number;
  currency: string;
}

export interface PlatformRevenueSummary {
  platformServicesGross: number;
  marketplaceFeesGross: number;
  /** Platform services + marketplace fees — use for accountancy. */
  totalRevenueGross: number;
  /** Buyer + seller trade volume when included in export (informational, not platform income). */
  activityVolumeGross: number;
  buyerPurchasesGross: number;
  sellerSalesGross: number;
  netAmount?: number;
  vatAmount?: number;
  currency: string;
  platformInvoiceCount: number;
  marketplaceFeeCount: number;
  buyerPurchaseCount: number;
  sellerSaleCount: number;
}

export interface PlatformRevenueReportData {
  reportNumber: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  isPartialPeriod: boolean;
  sellerFilterApplied: boolean;
  sellerFilterCount: number;
  records: FinanceRecordLine[];
  platformInvoices: PlatformRevenueInvoiceLine[];
  marketplaceFees: MarketplaceFeeLine[];
  summary: PlatformRevenueSummary;
}

export function buildPlatformRevenueReportNumber(dateFrom: string, dateTo: string): string {
  return `SN-REV-${dateFrom.replace(/-/g, '')}-${dateTo.replace(/-/g, '')}`;
}

/** @deprecated Use buildPlatformRevenueReportNumber(dateFrom, dateTo) */
export function buildPlatformRevenueReportNumberForMonth(year: number, month: number): string {
  const ym = `${year}${String(month).padStart(2, '0')}`;
  return `SN-REV-${ym}`;
}
