import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { DisplayAdsService } from './services/display-ads.service';
import { DisplayAdCampaignService } from './services/display-ad-campaign.service';

@Controller('ads')
export class PublicAdsController {
  constructor(
    private readonly displayAds: DisplayAdsService,
    private readonly campaigns: DisplayAdCampaignService,
  ) {}

  @Public()
  @Get('placements')
  getPlacements(@Query('context') context?: string) {
    return this.displayAds.getPlacements(context ?? 'homepage');
  }

  @Public()
  @Post('impression/:campaignId')
  async recordImpression(@Param('campaignId') campaignId: string) {
    const ok = await this.campaigns.recordImpression(campaignId);
    if (!ok) throw new NotFoundException('Campaign not found');
    return { ok: true };
  }

  @Public()
  @Get('click/:campaignId')
  async clickRedirect(
    @Param('campaignId') campaignId: string,
    @Res() res: Response,
  ) {
    const destination = await this.campaigns.recordClickAndGetDestination(campaignId);
    if (!destination) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    return res.redirect(302, destination);
  }
}
