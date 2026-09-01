import { BaseEntity } from '../../../common/entities/base.entity';

export type ConnectAccountStatus = 'pending' | 'active' | 'restricted' | 'disabled';

export class StripeConnectAccountEntity extends BaseEntity {
  userId!: string;
  stripeAccountId!: string;
  status!: ConnectAccountStatus;
  chargesEnabled!: boolean;
  payoutsEnabled!: boolean;
  onboardingUrl?: string;
}
