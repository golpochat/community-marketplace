import { BaseEntity } from '../../../common/entities/base.entity';

export type EmailActivationStatus = 'pending' | 'activated' | 'expired';

export class EmailActivationEntity extends BaseEntity {
  userId!: string;
  email!: string;
  token!: string;
  status!: EmailActivationStatus;
  expiresAt!: Date;
  activatedAt?: Date;
}
