import { BaseEntity } from '../../../common/entities/base.entity';

export type BanType = 'temporary' | 'permanent';
export type BanScope = 'platform' | 'listing' | 'chat';

export class BanEntity extends BaseEntity {
  userId!: string;
  bannedBy!: string;
  type!: BanType;
  scope!: BanScope;
  reason!: string;
  expiresAt?: Date;
  isActive!: boolean;
}
