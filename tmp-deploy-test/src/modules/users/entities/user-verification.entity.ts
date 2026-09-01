import { BaseEntity } from '../../../common/entities/base.entity';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type VerificationType = 'email' | 'phone' | 'identity';

export class UserVerificationEntity extends BaseEntity {
  userId!: string;
  type!: VerificationType;
  status!: VerificationStatus;
  documentUrl?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
}
