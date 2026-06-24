import { Module } from '@nestjs/common';

import { ModerationService } from './moderation.service';
import { BansService } from './services/bans.service';
import { ReportsService } from './services/reports.service';

/** Moderation HTTP routes live under /admin/moderation and /buyer/reports */
@Module({
  providers: [ModerationService, ReportsService, BansService],
  exports: [ModerationService],
})
export class ModerationModule {}
