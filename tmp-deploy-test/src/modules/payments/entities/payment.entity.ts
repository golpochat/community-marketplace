import { BaseEntity } from '../../../common/entities/base.entity';
import type { PaymentMethod, PaymentStatus } from '@community-marketplace/types';

export class PaymentEntity extends BaseEntity {
  buyerId!: string;
  sellerId!: string;
  listingId!: string;
  amount!: number;
  currency!: string;
  method!: PaymentMethod;
  status!: PaymentStatus;
  stripePaymentIntentId?: string;
  transactionRef?: string;
}
