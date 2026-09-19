import { Module } from '@nestjs/common';

import { MetricsController } from './metrics.controller';
import { MetricsScrapeGuard } from './metrics-scrape.guard';

@Module({
  controllers: [MetricsController],
  providers: [MetricsScrapeGuard],
})
export class MetricsModule {}
