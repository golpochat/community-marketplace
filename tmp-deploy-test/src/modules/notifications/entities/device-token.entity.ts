import { BaseEntity } from '../../../common/entities/base.entity';

export type DevicePlatform = 'ios' | 'android' | 'web';

export class DeviceTokenEntity extends BaseEntity {
  userId!: string;
  token!: string;
  platform!: DevicePlatform;
  isActive!: boolean;
}
