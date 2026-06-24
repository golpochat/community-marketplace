export const MODERATION_REPORT_REASONS = [
  'fraud',
  'harassment',
  'spam',
  'inappropriate_content',
  'scams',
  'fake_listing',
] as const;

export type ModerationReportReason = (typeof MODERATION_REPORT_REASONS)[number];

export const MODERATION_REPORT_STATUSES = ['pending', 'reviewed', 'action_taken'] as const;
export type ModerationReportStatus = (typeof MODERATION_REPORT_STATUSES)[number];

export const MODERATION_ACTION_TYPES = [
  'warn',
  'suspend',
  'ban',
  'delete_listing',
  'delete_message',
] as const;
export type ModerationActionType = (typeof MODERATION_ACTION_TYPES)[number];

export const SUSPENSION_DURATIONS = ['hours_24', 'days_7', 'days_30', 'permanent'] as const;
export type SuspensionDuration = (typeof SUSPENSION_DURATIONS)[number];

export const APPEAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type AppealStatus = (typeof APPEAL_STATUSES)[number];

export type ModerationReportTargetType = 'user' | 'listing' | 'message';

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetUserId?: string;
  listingId?: string;
  messageId?: string;
  reason: ModerationReportReason;
  description?: string;
  status: ModerationReportStatus;
  adminId?: string;
  autoFlagged: boolean;
  autoHidden: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationReportDetail extends ModerationReport {
  reporter?: { id: string; email: string; displayName?: string };
  targetUser?: { id: string; email: string; displayName?: string };
  listing?: { id: string; title: string; status: string; sellerId: string };
  message?: { id: string; content: string; senderId: string; threadId: string };
  admin?: { id: string; email: string; displayName?: string };
}

export interface ModerationAction {
  id: string;
  adminId: string;
  userId?: string;
  listingId?: string;
  messageId?: string;
  reportId?: string;
  actionType: ModerationActionType;
  suspensionDuration?: SuspensionDuration;
  notes?: string;
  expiresAt?: string;
  liftedAt?: string;
  createdAt: string;
}

export interface ModerationAppeal {
  id: string;
  userId: string;
  reportId?: string;
  moderationActionId?: string;
  message: string;
  status: AppealStatus;
  adminId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ModerationAuditEventType =
  | 'report_created'
  | 'report_assigned'
  | 'report_reviewed'
  | 'action_warn'
  | 'action_suspend'
  | 'action_ban'
  | 'action_delete_listing'
  | 'action_delete_message'
  | 'suspension_lifted'
  | 'ban_lifted'
  | 'appeal_submitted'
  | 'appeal_approved'
  | 'appeal_rejected'
  | 'auto_flag'
  | 'auto_hide';

export interface ModerationAuditLog {
  id: string;
  eventType: ModerationAuditEventType;
  actorId?: string;
  reportId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ModerationAnalytics {
  mostReportedUsers: Array<{ userId: string; count: number; displayName?: string }>;
  mostReportedListings: Array<{ listingId: string; count: number; title?: string }>;
  reasonDistribution: Array<{ reason: ModerationReportReason; count: number }>;
  actionStats: {
    warnings: number;
    suspensions: number;
    bans: number;
    deleteListings: number;
    deleteMessages: number;
  };
  appealOutcomes: {
    pending: number;
    approved: number;
    rejected: number;
  };
  generatedAt: string;
}

export interface ModerationReportFilters {
  status?: ModerationReportStatus;
  reason?: ModerationReportReason;
  targetType?: ModerationReportTargetType;
  adminId?: string;
  page?: number;
  limit?: number;
}
