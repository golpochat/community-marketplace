import { BaseEntity } from '../../../common/entities/base.entity';

export type OtpPurpose = 'login' | 'register' | 'password_reset';

export class OtpEntity extends BaseEntity {
  email!: string;
  code!: string;
  purpose!: OtpPurpose;
  expiresAt!: Date;
  consumedAt?: Date;
}
