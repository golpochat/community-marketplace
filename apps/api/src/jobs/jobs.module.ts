import { Global, Module } from '@nestjs/common';

import { LibsModule } from '../libs/libs.module';
import { JobQueueService } from './job-queue.service';

@Global()
@Module({
  imports: [LibsModule],
  providers: [JobQueueService],
  exports: [JobQueueService],
})
export class JobsModule {}
