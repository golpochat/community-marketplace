import type {
  MarketplaceFeeLine,
  PlatformRevenueInvoiceLine,
} from './platform-revenue-report.types';

export type FinanceRecordType =
  | 'buyer_purchase'
  | 'seller_sale'
  | 'platform_service'
  | 'marketplace_fee';

export type FinanceRecordCategory =
  | 'buyer'
  | 'seller'
  | 'platform_service'
  | 'marketplace_fee';

export const FINANCE_RECORD_CATEGORIES: FinanceRecordCategory[] = [
  'buyer',
  'seller',
  'platform_service',
  'marketplace_fee',
];

export const FINANCE_CATEGORY_LABELS: Record<FinanceRecordCategory, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  platform_service: 'Platform service',
  marketplace_fee: 'Marketplace fee',
};

const CATEGORY_TO_RECORD_TYPE: Record<FinanceRecordCategory, FinanceRecordType> = {
  buyer: 'buyer_purchase',
  seller: 'seller_sale',
  platform_service: 'platform_service',
  marketplace_fee: 'marketplace_fee',
};

export interface TradePaymentLine {
  date: string;
  receiptRef: string;
  listingTitle: string;
  gross: number;
  platformFee: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
}

export interface FinanceRecordLine {
  type: FinanceRecordType;
  typeLabel: string;
  date: string;
  reference: string;
  party: string;
  partyEmail: string;
  description: string;
  amount: number;
  currency: string;
}

export function buildFinanceRecords(
  platformInvoices: PlatformRevenueInvoiceLine[],
  tradePayments: TradePaymentLine[],
): FinanceRecordLine[] {
  const invoiceRows: FinanceRecordLine[] = platformInvoices.map((row) => ({
    type: 'platform_service',
    typeLabel: FINANCE_CATEGORY_LABELS.platform_service,
    date: row.date,
    reference: row.invoiceNumber,
    party: row.customerName,
    partyEmail: row.customerEmail,
    description: row.serviceLabel,
    amount: row.gross,
    currency: row.currency,
  }));

  const buyerRows: FinanceRecordLine[] = tradePayments.map((row) => ({
    type: 'buyer_purchase',
    typeLabel: FINANCE_CATEGORY_LABELS.buyer,
    date: row.date,
    reference: row.receiptRef,
    party: row.buyerName,
    partyEmail: row.buyerEmail,
    description: row.listingTitle,
    amount: row.gross,
    currency: row.currency,
  }));

  const sellerRows: FinanceRecordLine[] = tradePayments.map((row) => ({
    type: 'seller_sale',
    typeLabel: FINANCE_CATEGORY_LABELS.seller,
    date: row.date,
    reference: row.receiptRef,
    party: row.sellerName,
    partyEmail: row.sellerEmail,
    description: row.listingTitle,
    amount: row.gross,
    currency: row.currency,
  }));

  const feeRows: FinanceRecordLine[] = tradePayments
    .filter((row) => row.platformFee > 0)
    .map((row) => ({
      type: 'marketplace_fee',
      typeLabel: FINANCE_CATEGORY_LABELS.marketplace_fee,
      date: row.date,
      reference: row.receiptRef,
      party: row.sellerName,
      partyEmail: row.sellerEmail,
      description: row.listingTitle,
      amount: row.platformFee,
      currency: row.currency,
    }));

  return [...invoiceRows, ...buyerRows, ...sellerRows, ...feeRows].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
}

export function normalizeFinanceCategories(
  categories: FinanceRecordCategory[] | undefined,
): FinanceRecordCategory[] {
  if (!categories?.length) return [...FINANCE_RECORD_CATEGORIES];
  return categories.filter((category) => FINANCE_RECORD_CATEGORIES.includes(category));
}

/** Marketplace fees apply to seller-side sales only. */
export function effectiveFinanceCategories(
  categories: FinanceRecordCategory[],
): FinanceRecordCategory[] {
  if (!categories.includes('seller')) {
    return categories.filter((category) => category !== 'marketplace_fee');
  }
  return categories;
}

export function filterFinanceRecords(
  records: FinanceRecordLine[],
  options: {
    categories?: FinanceRecordCategory[];
    search?: string;
  },
): FinanceRecordLine[] {
  const categories = effectiveFinanceCategories(normalizeFinanceCategories(options.categories));
  const allowedTypes = new Set(categories.map((category) => CATEGORY_TO_RECORD_TYPE[category]));
  const query = options.search?.trim().toLowerCase();

  return records.filter((row) => {
    if (!allowedTypes.has(row.type)) return false;
    if (!query) return true;
    const haystack = [
      row.typeLabel,
      row.reference,
      row.party,
      row.partyEmail,
      row.description,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function applyRecordFilters(
  data: import('./platform-revenue-report.types').PlatformRevenueReportData,
  options: {
    categories?: FinanceRecordCategory[];
    search?: string;
  },
): import('./platform-revenue-report.types').PlatformRevenueReportData {
  const records = filterFinanceRecords(data.records, options);
  const currency = records[0]?.currency ?? data.summary.currency;

  const platformServicesGross = records
    .filter((row) => row.type === 'platform_service')
    .reduce((sum, row) => sum + row.amount, 0);
  const marketplaceFeesGross = records
    .filter((row) => row.type === 'marketplace_fee')
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    ...data,
    records,
    summary: {
      ...data.summary,
      currency,
      platformServicesGross,
      marketplaceFeesGross,
      totalRevenueGross: records.reduce((sum, row) => sum + row.amount, 0),
      platformInvoiceCount: records.filter((row) => row.type === 'platform_service').length,
      marketplaceFeeCount: records.filter((row) => row.type === 'marketplace_fee').length,
    },
  };
}
