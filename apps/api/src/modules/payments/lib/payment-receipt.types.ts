export interface PaymentReceiptLineItem {
  label: string;
  value: string;
}

export interface PaymentReceiptDocumentData {
  receiptNumber: string;
  paymentId: string;
  issuedAt: string;
  currency: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  feePercentApplied?: number;
  paymentMethod: string;
  providerReference?: string;
  listingId: string;
  listingTitle: string;
  listingLocation?: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  webAppUrl: string;
}

export function buildReceiptNumber(paymentId: string, issuedAt: Date): string {
  const date = issuedAt.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = paymentId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `SN-${date}-${suffix}`;
}

export function formatReceiptMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatReceiptDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IE', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso));
}
