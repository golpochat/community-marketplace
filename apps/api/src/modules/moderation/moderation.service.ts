import { Injectable } from '@nestjs/common';

import type { CreateBanDto, CreateReportDto, LiftBanDto, ResolveReportDto } from './dto/moderation.dto';
import { BansService } from './services/bans.service';
import { ReportsService } from './services/reports.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly bansService: BansService,
  ) {}

  createReport(reporterId: string, dto: CreateReportDto) {
    return this.reportsService.create(reporterId, dto);
  }

  getReports() {
    return this.reportsService.findAll();
  }

  resolveReport(reportId: string, moderatorId: string, dto: ResolveReportDto) {
    return this.reportsService.resolve(reportId, moderatorId, dto);
  }

  createBan(moderatorId: string, dto: CreateBanDto) {
    return this.bansService.create(moderatorId, dto);
  }

  getBans() {
    return this.bansService.findAll();
  }

  liftBan(banId: string, moderatorId: string, dto: LiftBanDto) {
    return this.bansService.lift(banId, moderatorId, dto);
  }

  isUserBanned(userId: string) {
    return { userId, banned: this.bansService.isUserBanned(userId) };
  }
}
