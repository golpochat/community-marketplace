import { BaseEntity } from '../../../common/entities/base.entity';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportTargetType = 'listing' | 'user' | 'message';

export class ReportEntity extends BaseEntity {
  reporterId!: string;
  targetType!: ReportTargetType;
  targetId!: string;
  reason!: string;
  description?: string;
  status!: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
}
