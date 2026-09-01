import { Global, Module } from '@nestjs/common';

import { LibsModule } from '../libs/libs.module';
import { JobQueueService } from './job-queue.service';
import { R2CleanupJob } from './r2-cleanup.job';

@Global()
@Module({
  imports: [LibsModule],
  providers: [JobQueueService, R2CleanupJob],
  exports: [JobQueueService],
})
export class JobsModule {}
