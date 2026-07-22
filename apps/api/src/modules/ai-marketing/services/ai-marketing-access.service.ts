import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { AiMarketingAccessStatus } from '@community-marketplace/types';

import { PlatformSettingsService } from '../../monetization/services/platform-settings.service';

@Injectable()
export class AiMarketingAccessService {
  constructor(private readonly platformSettings: PlatformSettingsService) {}

  isDeployEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
    return source.AI_MARKETING_ENABLED !== 'false';
  }

  async getStatus(): Promise<AiMarketingAccessStatus> {
    const deployEnabled = this.isDeployEnabled();
    if (!deployEnabled) {
      return { deployEnabled: false, published: false, effective: false };
    }

    const settings = await this.platformSettings.get();
    const published = Boolean(settings.aiMarketingEnabled);
    return {
      deployEnabled: true,
      published,
      effective: published,
    };
  }

  async isEffective(): Promise<boolean> {
    return (await this.getStatus()).effective;
  }

  async assertEffective(): Promise<void> {
    const status = await this.getStatus();
    if (!status.deployEnabled) {
      throw new ServiceUnavailableException(
        'AI Marketing Hub is temporarily unavailable.',
      );
    }
    if (!status.published) {
      throw new ServiceUnavailableException(
        'AI Marketing Hub is not published yet.',
      );
    }
  }
}
