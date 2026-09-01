import { BaseEntity } from '../../../common/entities/base.entity';
import type { UserRole, UserStatus } from '@community-marketplace/types';

export class UserProfileEntity extends BaseEntity {
  userId!: string;
  email!: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  phone?: string;
  primaryRoleId!: string;
  role!: UserRole;
  status!: UserStatus;
}
