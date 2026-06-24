import type {
  ModerationAction,
  ModerationAppeal,
  ModerationAuditLog,
  ModerationReport,
  ModerationReportDetail,
} from '@community-marketplace/types';
import type {
  ModerationAction as PrismaAction,
  ModerationAppeal as PrismaAppeal,
  ModerationAuditLog as PrismaAudit,
  ModerationReport as PrismaReport,
  User,
  Listing,
  ChatMessage,
} from '@prisma/client';

type ReportRow = PrismaReport & {
  reporter?: Pick<User, 'id' | 'email' | 'displayName'>;
  targetUser?: Pick<User, 'id' | 'email' | 'displayName'> | null;
  listing?: Pick<Listing, 'id' | 'title' | 'status' | 'sellerId'> | null;
  message?: Pick<ChatMessage, 'id' | 'content' | 'senderId' | 'threadId'> | null;
  admin?: Pick<User, 'id' | 'email' | 'displayName'> | null;
};

export function mapModerationReport(row: PrismaReport): ModerationReport {
  return {
    id: row.id,
    reporterId: row.reporterId,
    targetUserId: row.targetUserId ?? undefined,
    listingId: row.listingId ?? undefined,
    messageId: row.messageId ?? undefined,
    reason: row.reason,
    description: row.description ?? undefined,
    status: row.status,
    adminId: row.adminId ?? undefined,
    autoFlagged: row.autoFlagged,
    autoHidden: row.autoHidden,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapModerationReportDetail(row: ReportRow): ModerationReportDetail {
  return {
    ...mapModerationReport(row),
    reporter: row.reporter
      ? {
          id: row.reporter.id,
          email: row.reporter.email,
          displayName: row.reporter.displayName ?? undefined,
        }
      : undefined,
    targetUser: row.targetUser
      ? {
          id: row.targetUser.id,
          email: row.targetUser.email,
          displayName: row.targetUser.displayName ?? undefined,
        }
      : undefined,
    listing: row.listing
      ? {
          id: row.listing.id,
          title: row.listing.title,
          status: row.listing.status,
          sellerId: row.listing.sellerId,
        }
      : undefined,
    message: row.message
      ? {
          id: row.message.id,
          content: row.message.content,
          senderId: row.message.senderId,
          threadId: row.message.threadId,
        }
      : undefined,
    admin: row.admin
      ? {
          id: row.admin.id,
          email: row.admin.email,
          displayName: row.admin.displayName ?? undefined,
        }
      : undefined,
  };
}

export function mapModerationAction(row: PrismaAction): ModerationAction {
  return {
    id: row.id,
    adminId: row.adminId,
    userId: row.userId ?? undefined,
    listingId: row.listingId ?? undefined,
    messageId: row.messageId ?? undefined,
    reportId: row.reportId ?? undefined,
    actionType: row.actionType,
    suspensionDuration: row.suspensionDuration ?? undefined,
    notes: row.notes ?? undefined,
    expiresAt: row.expiresAt?.toISOString(),
    liftedAt: row.liftedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapModerationAppeal(row: PrismaAppeal): ModerationAppeal {
  return {
    id: row.id,
    userId: row.userId,
    reportId: row.reportId ?? undefined,
    moderationActionId: row.moderationActionId ?? undefined,
    message: row.message,
    status: row.status,
    adminId: row.adminId ?? undefined,
    adminNotes: row.adminNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapModerationAuditLog(row: PrismaAudit): ModerationAuditLog {
  return {
    id: row.id,
    eventType: row.eventType as ModerationAuditLog['eventType'],
    actorId: row.actorId ?? undefined,
    reportId: row.reportId ?? undefined,
    userId: row.userId ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
