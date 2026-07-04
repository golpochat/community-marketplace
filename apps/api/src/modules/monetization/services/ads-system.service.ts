import { Injectable } from '@nestjs/common';

import type { AdsSystemStatus } from '@community-marketplace/types';

import {
  isDisplayAdvertisingEffective,
  isFeaturedSlotsEffective,
  isListingBoostEffective,
  readAdsSystemEnv,
  resolveAdsSystemStatus,
} from '../lib/ads-system.lib';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class AdsSystemService {
  constructor(private readonly settings: PlatformSettingsService) {}

  private env() {
    return readAdsSystemEnv();
  }

  async getStatus(): Promise<AdsSystemStatus> {
    const settings = await this.settings.get();
    return resolveAdsSystemStatus(this.env(), settings);
  }

  async isListingBoostEffective(): Promise<boolean> {
    const settings = await this.settings.get();
    return isListingBoostEffective(this.env(), settings);
  }

  async isFeaturedSlotsEffective(): Promise<boolean> {
    const settings = await this.settings.get();
    return isFeaturedSlotsEffective(this.env(), settings);
  }

  async isDisplayAdvertisingEffective(): Promise<boolean> {
    const settings = await this.settings.get();
    return isDisplayAdvertisingEffective(this.env(), settings);
  }
}
