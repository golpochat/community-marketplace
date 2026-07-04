import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  APP_SHORT_NAME,
  PLATFORM_CURRENCY,
} from '@community-marketplace/config';
import type {
  PlatformGovernanceEffective,
  PlatformGovernanceEnvDefaults,
  PlatformGovernanceSettings,
  PlatformGovernanceStatus,
  PlatformPublicMeta,
} from '@community-marketplace/types';
import type { PlatformGovernanceUpdateInput } from '@community-marketplace/validation';

import { PrismaService } from '../../database/prisma.service';

const DEFAULT_GOVERNANCE: PlatformGovernanceSettings = {
  maintenanceMode: false,
  platformNameOverrideEnabled: false,
  platformName: null,
  supportEmailOverrideEnabled: false,
  supportEmail: null,
  defaultCurrencyOverrideEnabled: false,
  defaultCurrency: null,
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  securityMfaRequired: false,
};

@Injectable()
export class PlatformGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  getEnvDefaults(): PlatformGovernanceEnvDefaults {
    return {
      platformName: APP_SHORT_NAME,
      supportEmail:
        this.config.get<string>('SUPPORT_EMAIL')?.trim() ||
        this.config.get<string>('EMAIL_FROM')?.trim() ||
        'support@sellnearby.ie',
      defaultCurrency: PLATFORM_CURRENCY,
    };
  }

  resolveEffective(settings: PlatformGovernanceSettings): PlatformGovernanceEffective {
    const env = this.getEnvDefaults();
    return {
      platformName:
        settings.platformNameOverrideEnabled && settings.platformName?.trim()
          ? settings.platformName.trim()
          : env.platformName,
      supportEmail:
        settings.supportEmailOverrideEnabled && settings.supportEmail?.trim()
          ? settings.supportEmail.trim()
          : env.supportEmail,
      defaultCurrency:
        settings.defaultCurrencyOverrideEnabled && settings.defaultCurrency?.trim()
          ? settings.defaultCurrency.trim().toUpperCase()
          : env.defaultCurrency,
    };
  }

  async getSettings(): Promise<PlatformGovernanceSettings> {
    const row = await this.ensureRow();
    return this.mapRow(row);
  }

  async getStatus(): Promise<PlatformGovernanceStatus> {
    const settings = await this.getSettings();
    const envDefaults = this.getEnvDefaults();
    return {
      settings,
      envDefaults,
      effective: this.resolveEffective(settings),
      payments: {
        provider: 'stripe',
        configured: Boolean(this.config.get<string>('STRIPE_SECRET_KEY')?.trim()),
      },
    };
  }

  async getPublicMeta(): Promise<PlatformPublicMeta> {
    const settings = await this.getSettings();
    const effective = this.resolveEffective(settings);
    return {
      platformName: effective.platformName,
      supportEmail: effective.supportEmail,
      defaultCurrency: effective.defaultCurrency,
      maintenanceMode: settings.maintenanceMode,
    };
  }

  async isMaintenanceMode(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.maintenanceMode;
  }

  async areEmailNotificationsEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.emailNotificationsEnabled;
  }

  async arePushNotificationsEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.pushNotificationsEnabled;
  }

  async getSupportEmail(): Promise<string> {
    const settings = await this.getSettings();
    return this.resolveEffective(settings).supportEmail;
  }

  async getPlatformName(): Promise<string> {
    const settings = await this.getSettings();
    return this.resolveEffective(settings).platformName;
  }

  async update(input: PlatformGovernanceUpdateInput): Promise<PlatformGovernanceSettings> {
    await this.ensureRow();
    const row = await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data: {
        ...(input.maintenanceMode !== undefined ? { maintenanceMode: input.maintenanceMode } : {}),
        ...(input.platformNameOverrideEnabled !== undefined
          ? { platformNameOverrideEnabled: input.platformNameOverrideEnabled }
          : {}),
        ...(input.platformName !== undefined ? { platformName: input.platformName } : {}),
        ...(input.supportEmailOverrideEnabled !== undefined
          ? { supportEmailOverrideEnabled: input.supportEmailOverrideEnabled }
          : {}),
        ...(input.supportEmail !== undefined ? { supportEmail: input.supportEmail } : {}),
        ...(input.defaultCurrencyOverrideEnabled !== undefined
          ? { defaultCurrencyOverrideEnabled: input.defaultCurrencyOverrideEnabled }
          : {}),
        ...(input.defaultCurrency !== undefined
          ? { defaultCurrency: input.defaultCurrency?.toUpperCase() ?? null }
          : {}),
        ...(input.emailNotificationsEnabled !== undefined
          ? { emailNotificationsEnabled: input.emailNotificationsEnabled }
          : {}),
        ...(input.pushNotificationsEnabled !== undefined
          ? { pushNotificationsEnabled: input.pushNotificationsEnabled }
          : {}),
        ...(input.securityMfaRequired !== undefined
          ? { securityMfaRequired: input.securityMfaRequired }
          : {}),
      },
    });
    return this.mapRow(row);
  }

  private mapRow(row: {
    maintenanceMode?: boolean;
    platformNameOverrideEnabled?: boolean;
    platformName?: string | null;
    supportEmailOverrideEnabled?: boolean;
    supportEmail?: string | null;
    defaultCurrencyOverrideEnabled?: boolean;
    defaultCurrency?: string | null;
    emailNotificationsEnabled?: boolean;
    pushNotificationsEnabled?: boolean;
    securityMfaRequired?: boolean;
  }): PlatformGovernanceSettings {
    return {
      maintenanceMode: row.maintenanceMode ?? DEFAULT_GOVERNANCE.maintenanceMode,
      platformNameOverrideEnabled:
        row.platformNameOverrideEnabled ?? DEFAULT_GOVERNANCE.platformNameOverrideEnabled,
      platformName: row.platformName ?? null,
      supportEmailOverrideEnabled:
        row.supportEmailOverrideEnabled ?? DEFAULT_GOVERNANCE.supportEmailOverrideEnabled,
      supportEmail: row.supportEmail ?? null,
      defaultCurrencyOverrideEnabled:
        row.defaultCurrencyOverrideEnabled ?? DEFAULT_GOVERNANCE.defaultCurrencyOverrideEnabled,
      defaultCurrency: row.defaultCurrency ?? null,
      emailNotificationsEnabled:
        row.emailNotificationsEnabled ?? DEFAULT_GOVERNANCE.emailNotificationsEnabled,
      pushNotificationsEnabled:
        row.pushNotificationsEnabled ?? DEFAULT_GOVERNANCE.pushNotificationsEnabled,
      securityMfaRequired: row.securityMfaRequired ?? DEFAULT_GOVERNANCE.securityMfaRequired,
    };
  }

  private async ensureRow() {
    const existing = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });
    if (existing) return existing;

    return this.prisma.platformSettings.create({
      data: {
        id: 'default',
        defaultPlatformFeePercent: 10,
        verifiedSellerFeePercent: 8,
        cashbackPercent: 1.5,
        coolingDays: 14,
        maxCashbackPerOrder: 10,
        maxCashbackPerMonth: 20,
        cashbackEnabled: true,
        cashbackMinOrderAmount: 5,
        allowedCashbackMethods: ['card'],
        boostsEnabled: true,
        featuredEnabled: true,
        displayAdsEnabled: false,
        emailProvider: 'brevo',
        emailFallbackEnabled: false,
        ...DEFAULT_GOVERNANCE,
      },
    });
  }
}
