import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  aiMarketingApplyImageSchema,
  aiMarketingBestPostingTimeSchema,
  aiMarketingCampaignPackSchema,
  aiMarketingGenerateSchema,
  aiMarketingImageSchema,
  aiMarketingPriceSuggestSchema,
} from '@community-marketplace/validation';

import {
  RequirePermissions,
  RequireRole,
} from '../../common/decorators/rbac.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { AiBestPostingTimeService } from './services/ai-best-posting-time.service';
import { AiCampaignPackService } from './services/ai-campaign-pack.service';
import { AiGenerationService } from './services/ai-generation.service';
import { AiImageService } from './services/ai-image.service';
import { AiPriceSuggestionService } from './services/ai-price-suggestion.service';

@RequireRole('SELLER')
@Controller('seller/marketing-hub')
export class SellerAiMarketingController {
  constructor(
    private readonly generations: AiGenerationService,
    private readonly images: AiImageService,
    private readonly priceSuggestions: AiPriceSuggestionService,
    private readonly bestPostingTimes: AiBestPostingTimeService,
    private readonly campaignPacks: AiCampaignPackService,
  ) {}

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Get('quota')
  getQuota(@CurrentUser() user: AuthenticatedUser) {
    return this.generations.getQuota(user.id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('generate')
  generate(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = aiMarketingGenerateSchema.parse(body);
    return this.generations.generate(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('image')
  processImage(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = aiMarketingImageSchema.parse(body);
    return this.images.process(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('image/apply')
  applyImage(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = aiMarketingApplyImageSchema.parse(body);
    return this.images.applyToListing(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('price-suggest')
  suggestPrice(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = aiMarketingPriceSuggestSchema.parse(body);
    return this.priceSuggestions.suggest(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('best-posting-time')
  bestPostingTime(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const dto = aiMarketingBestPostingTimeSchema.parse(body);
    return this.bestPostingTimes.suggest(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('campaign-pack')
  async campaignPack(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Res() res: Response,
  ) {
    const dto = aiMarketingCampaignPackSchema.parse(body);
    const file = await this.campaignPacks.buildPack(user.id, dto);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.buffer);
  }
}
