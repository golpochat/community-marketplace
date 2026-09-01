import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { JobsModule } from './jobs/jobs.module';
import { LibsModule } from './libs/libs.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    LibsModule,
    EventsModule,
    JobsModule,
    SearchModule,
    ModerationModule,
    NotificationsModule,
  ],
})
export class WorkerAppModule {}
