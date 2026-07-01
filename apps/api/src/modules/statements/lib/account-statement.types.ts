/** Marketplace sale row — amounts are positive; section context implies inflow. */
export interface SaleStatementLine {
  date: string;
  listingTitle: string;
  receiptRef: string;
  gross: number;
  marketplaceFee: number;
  netToSeller: number;
  currency: string;
}

/** Platform package purchase — amount is positive; shown under charges section. */
export interface PlatformServiceStatementLine {
  date: string;
  serviceLabel: string;
  /** SellNearby invoice number, e.g. SN-INV-… */
  invoiceNumber: string;
  amount: number;
  currency: string;
}

/** Stripe Connect payout received in the statement period. */
export interface PayoutStatementLine {
  date: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
}

export interface SellerStatementSummary {
  grossSales: number;
  marketplaceFeesOnSales: number;
  netFromSales: number;
  platformServices: number;
  netPeriodActivity: number;
  payoutsReceivedInPeriod: number;
  /** Net from period sales not yet transferred to Connect (separate-charge mode only). */
  pendingSettlementNet: number;
  currency: string;
  saleCount: number;
  platformServiceCount: number;
  payoutCount: number;
}

export interface BuyerStatementSummary {
  totalPurchases: number;
  currency: string;
  purchaseCount: number;
}

/** Buyer purchase row */
export interface BuyerPurchaseStatementLine {
  date: string;
  listingTitle: string;
  receiptRef: string;
  amount: number;
  currency: string;
}

export interface AccountStatementData {
  statementNumber: string;
  role: 'seller' | 'buyer';
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  /** True when issued before the calendar period has ended (activity to date). */
  isPartialPeriod: boolean;
  accountHolderName: string;
  accountHolderEmail: string;
  salesLines: SaleStatementLine[];
  platformServiceLines: PlatformServiceStatementLine[];
  payoutLines: PayoutStatementLine[];
  buyerPurchaseLines: BuyerPurchaseStatementLine[];
  summary: SellerStatementSummary | BuyerStatementSummary;
}

export function buildStatementNumber(
  role: 'seller' | 'buyer',
  year: number,
  month: number,
  userId: string,
): string {
  const ym = `${year}${String(month).padStart(2, '0')}`;
  const suffix = userId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `SN-STMT-${role === 'seller' ? 'SEL' : 'BUY'}-${ym}-${suffix}`;
}

export function formatStatementPeriodLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('en-IE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  );
}

export function formatStatementPeriodRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function statementPeriodBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

/** Inclusive UTC day bounds from YYYY-MM-DD strings. */
export function parseDateRangeBounds(dateFrom: string, dateTo: string): { start: Date; end: Date } {
  const start = new Date(`${dateFrom}T00:00:00.000Z`);
  const end = new Date(`${dateTo}T23:59:59.999Z`);
  return { start, end };
}

export function buildRangeStatementNumber(
  role: 'seller' | 'buyer',
  dateFrom: string,
  dateTo: string,
  userId: string,
): string {
  const from = dateFrom.replace(/-/g, '');
  const to = dateTo.replace(/-/g, '');
  const suffix = userId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `SN-STMT-${role === 'seller' ? 'SEL' : 'BUY'}-${from}-${to}-${suffix}`;
}

export function isSellerStatementSummary(
  summary: SellerStatementSummary | BuyerStatementSummary,
): summary is SellerStatementSummary {
  return 'grossSales' in summary;
}
