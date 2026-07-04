import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  EmailEnvSenderDefaults,
  EmailPlatformSettings,
  EmailProviderId,
  EmailSystemStatus,
} from '@community-marketplace/types';
import type { EmailPlatformSettingsUpdateInput } from '@community-marketplace/validation';
import { APP_SHORT_NAME } from '@community-marketplace/config';

import { PrismaService } from '../database/prisma.service';
import { EmailProviderRegistry } from './email-provider.registry';
import type { EmailSender } from './providers/email-provider.interface';

const DEFAULT_EMAIL_SETTINGS: EmailPlatformSettings = {
  emailProvider: 'brevo',
  emailFallbackEnabled: false,
  emailFromAddressOverrideEnabled: false,
  emailFromAddress: null,
  emailFromNameOverrideEnabled: false,
  emailFromName: null,
};

@Injectable()
export class EmailSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: EmailProviderRegistry,
    private readonly config: ConfigService,
  ) {}

  async get(): Promise<EmailPlatformSettings> {
    const row = await this.ensureRow();
    return this.mapRow(row);
  }

  async update(input: EmailPlatformSettingsUpdateInput): Promise<EmailPlatformSettings> {
    await this.ensureRow();
    const row = await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data: {
        ...(input.emailProvider !== undefined ? { emailProvider: input.emailProvider } : {}),
        ...(input.emailFallbackEnabled !== undefined
          ? { emailFallbackEnabled: input.emailFallbackEnabled }
          : {}),
        ...(input.emailFromAddressOverrideEnabled !== undefined
          ? { emailFromAddressOverrideEnabled: input.emailFromAddressOverrideEnabled }
          : {}),
        ...(input.emailFromAddress !== undefined
          ? { emailFromAddress: input.emailFromAddress }
          : {}),
        ...(input.emailFromNameOverrideEnabled !== undefined
          ? { emailFromNameOverrideEnabled: input.emailFromNameOverrideEnabled }
          : {}),
        ...(input.emailFromName !== undefined ? { emailFromName: input.emailFromName } : {}),
      },
    });
    return this.mapRow(row);
  }

  async getSystemStatus(): Promise<EmailSystemStatus> {
    const settings = await this.get();
    const envDefaults = this.getEnvSenderDefaults();
    const effectiveSender = this.resolveSender(settings);
    const providers = this.registry.list().map((provider) => ({
      id: provider.id,
      label: provider.label,
      configured: provider.isConfigured(),
      description: provider.description,
    }));
    const active = this.registry.get(settings.emailProvider);
    return {
      settings,
      envDefaults,
      effectiveSender: {
        fromAddress: effectiveSender.email,
        fromName: effectiveSender.name,
      },
      providers,
      activeProvider: settings.emailProvider,
      activeProviderConfigured: active?.isConfigured() ?? false,
    };
  }

  getEnvSenderDefaults(): EmailEnvSenderDefaults {
    return {
      fromAddress:
        this.config.get<string>('EMAIL_FROM')?.trim() || 'noreply@sellnearby.ie',
      fromName: this.config.get<string>('EMAIL_FROM_NAME')?.trim() || APP_SHORT_NAME,
    };
  }

  resolveSender(settings: EmailPlatformSettings): EmailSender {
    const env = this.getEnvSenderDefaults();
    const email =
      settings.emailFromAddressOverrideEnabled && settings.emailFromAddress?.trim()
        ? settings.emailFromAddress.trim()
        : env.fromAddress;
    const name =
      settings.emailFromNameOverrideEnabled && settings.emailFromName?.trim()
        ? settings.emailFromName.trim()
        : env.fromName;
    return { email, name };
  }

  resolveProviderChain(settings: EmailPlatformSettings): EmailProviderId[] {
    const primary = settings.emailProvider;
    const chain: EmailProviderId[] = [primary];

    if (!settings.emailFallbackEnabled) {
      return chain;
    }

    for (const provider of this.registry.list()) {
      if (provider.id === primary || provider.id === 'stub') continue;
      if (provider.isConfigured()) {
        chain.push(provider.id);
      }
    }

    return chain;
  }

  private mapRow(row: {
    emailProvider?: string;
    emailFallbackEnabled?: boolean;
    emailFromAddressOverrideEnabled?: boolean;
    emailFromAddress?: string | null;
    emailFromNameOverrideEnabled?: boolean;
    emailFromName?: string | null;
  }): EmailPlatformSettings {
    return {
      emailProvider: (row.emailProvider ?? 'brevo') as EmailProviderId,
      emailFallbackEnabled: row.emailFallbackEnabled ?? false,
      emailFromAddressOverrideEnabled: row.emailFromAddressOverrideEnabled ?? false,
      emailFromAddress: row.emailFromAddress ?? null,
      emailFromNameOverrideEnabled: row.emailFromNameOverrideEnabled ?? false,
      emailFromName: row.emailFromName ?? null,
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
        emailProvider: DEFAULT_EMAIL_SETTINGS.emailProvider,
        emailFallbackEnabled: DEFAULT_EMAIL_SETTINGS.emailFallbackEnabled,
        emailFromAddressOverrideEnabled: DEFAULT_EMAIL_SETTINGS.emailFromAddressOverrideEnabled,
        emailFromAddress: DEFAULT_EMAIL_SETTINGS.emailFromAddress,
        emailFromNameOverrideEnabled: DEFAULT_EMAIL_SETTINGS.emailFromNameOverrideEnabled,
        emailFromName: DEFAULT_EMAIL_SETTINGS.emailFromName,
      },
    });
  }
}
