import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';

import { HealthService } from './health.service';

@SkipThrottle({ default: true })
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  check() {
    return this.health.live();
  }

  @Public()
  @Get('live')
  live() {
    return this.health.live();
  }

  @Public()
  @Get('ready')
  async ready() {
    const report = await this.health.ready();
    if (report.status === 'error') {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }

  @Public()
  @Get('queues')
  async queues() {
    return this.health.queues();
  }
}
