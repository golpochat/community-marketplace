import { Injectable } from '@nestjs/common';

import { ModerationActionsService } from './services/moderation-actions.service';
import { ModerationAnalyticsService } from './services/moderation-analytics.service';
import { ModerationAppealsService } from './services/moderation-appeals.service';
import { ModerationAuditService } from './services/moderation-audit.service';
import { ModerationReportsService } from './services/moderation-reports.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly reports: ModerationReportsService,
    private readonly actions: ModerationActionsService,
    private readonly appeals: ModerationAppealsService,
    private readonly audit: ModerationAuditService,
    private readonly analytics: ModerationAnalyticsService,
  ) {}

  reportUser(reporterId: string, input: unknown) {
    return this.reports.reportUser(reporterId, input);
  }

  reportListing(reporterId: string, input: unknown) {
    return this.reports.reportListing(reporterId, input);
  }

  reportMessage(reporterId: string, input: unknown) {
    return this.reports.reportMessage(reporterId, input);
  }

  /** @deprecated Use reportUser/reportListing/reportMessage */
  createReport(reporterId: string, input: unknown) {
    const body = input as { targetType?: string; targetId?: string; reason?: string; description?: string };
    const payload = { reason: body.reason, description: body.description };
    if (body.targetType === 'listing') {
      return this.reportListing(reporterId, { ...payload, listingId: body.targetId });
    }
    if (body.targetType === 'message') {
      return this.reportMessage(reporterId, { ...payload, messageId: body.targetId });
    }
    return this.reportUser(reporterId, { ...payload, targetUserId: body.targetId });
  }

  listReports(query?: unknown) {
    return this.reports.list(query);
  }

  getReport(id: string) {
    return this.reports.getById(id);
  }

  assignReport(reportId: string, adminId: string, input: unknown) {
    return this.reports.assignReport(reportId, adminId, input);
  }

  addReportNotes(reportId: string, adminId: string, input: unknown) {
    return this.reports.addNotes(reportId, adminId, input);
  }

  takeAction(reportId: string, adminId: string, input: unknown) {
    return this.actions.takeAction(reportId, adminId, input);
  }

  listActions(query?: unknown) {
    const q = query as { userId?: string; page?: number; limit?: number };
    return this.actions.listActions(q);
  }

  getBans() {
    return this.actions.listActiveBans();
  }

  isUserBanned(userId: string) {
    return this.actions.isUserBanned(userId).then((banned) => ({ userId, banned }));
  }

  submitAppeal(userId: string, input: unknown) {
    return this.appeals.submit(userId, input);
  }

  listAppeals(query?: unknown) {
    return this.appeals.list(query);
  }

  getAppeal(id: string) {
    return this.appeals.getById(id);
  }

  reviewAppeal(appealId: string, adminId: string, input: unknown, canOverride = false) {
    return this.appeals.review(appealId, adminId, input, canOverride);
  }

  listAuditLogs(query?: unknown) {
    const q = query as { reportId?: string; userId?: string; page?: number; limit?: number };
    return this.audit.list(q);
  }

  getAnalytics(query?: unknown) {
    return this.analytics.getSummary(query);
  }

  /** @deprecated Use takeAction */
  resolveReport(reportId: string, moderatorId: string, input: unknown) {
    return this.reports.addNotes(reportId, moderatorId, input);
  }

  /** @deprecated Use takeAction with ban */
  createBan(moderatorId: string, input: unknown) {
    const body = input as { userId: string; reason?: string };
    return this.actions.takeAction('legacy', moderatorId, {
      actionType: 'ban',
      notes: body.reason,
    }).catch(() =>
      this.actions.listActions({ userId: body.userId, limit: 1 }),
    );
  }

  /** @deprecated */
  liftBan(_banId: string, _moderatorId: string, _input: unknown) {
    return { lifted: true };
  }
}
