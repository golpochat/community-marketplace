import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { UtilsModule } from '../../utils/utils.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ModerationActionsService } from './services/moderation-actions.service';
import { ModerationAnalyticsService } from './services/moderation-analytics.service';
import { ModerationAppealsService } from './services/moderation-appeals.service';
import { ModerationAuditService } from './services/moderation-audit.service';
import { ModerationContentCheckService } from './services/moderation-content-check.service';
import { ModerationReportsService } from './services/moderation-reports.service';
import { ModerationSuspensionJobService } from './services/moderation-suspension.job';

@Module({
  imports: [DatabaseModule, EventsModule, JobsModule, LibsModule, UtilsModule],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    ModerationReportsService,
    ModerationActionsService,
    ModerationAppealsService,
    ModerationAuditService,
    ModerationContentCheckService,
    ModerationAnalyticsService,
    ModerationSuspensionJobService,
  ],
  exports: [ModerationService, ModerationContentCheckService],
})
export class ModerationModule {}
