import { Injectable } from '@nestjs/common';

import { LoggerLib } from '../libs/logger.lib';

export interface Job {
  name: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class JobQueueService {
  constructor(private readonly logger: LoggerLib) {}

  async enqueue(job: Job): Promise<void> {
    this.logger.log('JobQueue', `Enqueued job: ${job.name}`);
    // Replace with BullMQ / Redis queue in production
  }

  async process(job: Job): Promise<void> {
    this.logger.log('JobQueue', `Processing job: ${job.name}`);
  }
}
