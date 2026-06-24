export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

export interface Payment {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  createdAt: string;
  updatedAt: string;
}
