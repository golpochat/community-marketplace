import { BaseEntity } from '../../../common/entities/base.entity';

export type AdminActionType =
  | 'user_suspend'
  | 'user_activate'
  | 'listing_approve'
  | 'listing_reject'
  | 'ban_create'
  | 'ban_lift'
  | 'report_resolve';

export class AdminAuditEntity extends BaseEntity {
  adminId!: string;
  action!: AdminActionType;
  targetType!: string;
  targetId!: string;
  metadata?: Record<string, unknown>;
}
