import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { JobsModule } from '../../jobs/jobs.module';
import { SearchModule } from '../search/search.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, JobsModule, SearchModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
