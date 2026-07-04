import { Controller, Get, Query } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { DisplayAdsService } from './services/display-ads.service';

@Controller('ads')
export class PublicAdsController {
  constructor(private readonly displayAds: DisplayAdsService) {}

  @Public()
  @Get('placements')
  getPlacements(@Query('context') context?: string) {
    return this.displayAds.getPlacements(context ?? 'homepage');
  }
}
