import type { paymentAdminFiltersSchema } from '@community-marketplace/validation';
import type { z } from 'zod';

export type PaymentAdminFiltersInput = z.infer<typeof paymentAdminFiltersSchema>;

export type ManualPayoutInput = {
  sellerId: string;
  amount: number;
  currency: string;
};
