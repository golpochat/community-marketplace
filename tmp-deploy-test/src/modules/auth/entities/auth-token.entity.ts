import { BaseEntity } from '../../../common/entities/base.entity';

export class AuthTokenEntity extends BaseEntity {
  userId!: string;
  accessToken!: string;
  refreshToken!: string;
  expiresAt!: Date;
  revokedAt?: Date;
}
