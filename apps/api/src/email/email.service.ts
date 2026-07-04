import { Injectable } from '@nestjs/common';

import type { EmailProviderId, EmailSendOutcome } from '@community-marketplace/types';

import { LoggerLib } from '../libs/logger.lib';
import { EmailProviderRegistry } from './email-provider.registry';
import { EmailSettingsService } from './email-settings.service';
import type { OutboundEmail } from './providers/email-provider.interface';

@Injectable()
export class EmailService {
  constructor(
    private readonly settings: EmailSettingsService,
    private readonly registry: EmailProviderRegistry,
    private readonly logger: LoggerLib,
  ) {}

  async send(message: OutboundEmail, context = 'EmailService'): Promise<EmailSendOutcome> {
    const platformSettings = await this.settings.get();
    const from = this.settings.resolveSender(platformSettings);
    const chain = this.settings.resolveProviderChain(platformSettings);
    const attemptedProviders: EmailProviderId[] = [];

    for (const providerId of chain) {
      const provider = this.registry.get(providerId);
      if (!provider) continue;

      attemptedProviders.push(providerId);

      if (providerId !== 'stub' && !provider.isConfigured()) {
        this.logger.log(context, `Skipping ${providerId} — not configured`);
        continue;
      }

      try {
        const result = await provider.send(message, from);
        if (result.sent || result.mode === 'stub') {
          this.logger.log(
            context,
            `Email to ${message.to} via ${providerId} (${result.mode})`,
          );
          return { ...result, attemptedProviders };
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.error(context, `Provider ${providerId} failed for ${message.to}`, undefined, {
          detail,
        });
        if (!platformSettings.emailFallbackEnabled) {
          throw error;
        }
      }
    }

    const stub = this.registry.get('stub');
    if (stub) {
      const result = await stub.send(message, from);
      return { ...result, attemptedProviders: [...attemptedProviders, 'stub'] };
    }

    return {
      sent: false,
      provider: platformSettings.emailProvider,
      mode: 'stub',
      attemptedProviders,
    };
  }

  async sendWelcomeEmail(to: string): Promise<EmailSendOutcome> {
    return this.send(
      {
        to,
        subject: 'Welcome to SellNearby',
        html: '<p>Hello! Welcome to SellNearby.</p>',
        text: 'Hello! Welcome to SellNearby.',
      },
      'EmailService.sendWelcomeEmail',
    );
  }
}
