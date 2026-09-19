import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';

import { MetricsScrapeGuard } from './metrics-scrape.guard';
import { metricsRegistry } from './metrics.registry';

@SkipThrottle({ default: true })
@Controller('metrics')
export class MetricsController {
  @Public()
  @UseGuards(MetricsScrapeGuard)
  @Get()
  async metrics(@Res() res: Response) {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  }
}
