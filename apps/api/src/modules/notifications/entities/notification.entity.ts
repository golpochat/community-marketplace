import { BaseEntity } from '../../../common/entities/base.entity';
import type { NotificationType } from '@community-marketplace/types';

export class NotificationEntity extends BaseEntity {
  userId!: string;
  type!: NotificationType;
  title!: string;
  body!: string;
  read!: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}
