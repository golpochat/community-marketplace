import { Injectable } from '@nestjs/common';

import type { DisplayAdsPlacementsResponse } from '@community-marketplace/types';

import { getDisplayAdPlacementsForContext } from '../lib/display-ads.lib';
import { readAdsSystemEnv } from '../lib/ads-system.lib';
import { AdsSystemService } from './ads-system.service';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class DisplayAdsService {
  constructor(
    private readonly adsSystem: AdsSystemService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async getPlacements(context: string): Promise<DisplayAdsPlacementsResponse> {
    const env = readAdsSystemEnv();
    const settings = await this.settings.get();
    const effective = await this.adsSystem.isDisplayAdvertisingEffective();
    const preview =
      env.systemEnabled && env.previewMode && !settings.displayAdsEnabled;

    const definitions = getDisplayAdPlacementsForContext(context);

    return {
      enabled: effective,
      preview,
      context: context.trim().toLowerCase() || 'homepage',
      slots: definitions.map((definition) => ({
        placement: definition.placement,
        label: definition.label,
        width: definition.width,
        height: definition.height,
        preview,
      })),
    };
  }
}
