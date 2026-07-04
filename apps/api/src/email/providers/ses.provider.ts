import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EmailProvider, EmailSender, OutboundEmail } from './email-provider.interface';

/**
 * Amazon SES adapter — registered in the provider registry so admin can select it.
 * Wire @aws-sdk/client-ses in send() when you are ready to go live on SES.
 */
@Injectable()
export class SesEmailProvider implements EmailProvider {
  readonly id = 'ses' as const;
  readonly label = 'Amazon SES';
  readonly description =
    'Amazon Simple Email Service (AWS_SES_REGION + AWS credentials in API .env).';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const region = this.config.get<string>('AWS_SES_REGION')?.trim();
    const accessKey =
      this.config.get<string>('AWS_SES_ACCESS_KEY_ID')?.trim() ??
      this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
    const secretKey =
      this.config.get<string>('AWS_SES_SECRET_ACCESS_KEY')?.trim() ??
      this.config.get<string>('AWS_SECRET_ACCESS_KEY')?.trim();
    return Boolean(region && accessKey && secretKey);
  }

  async send(_message: OutboundEmail, _from: EmailSender) {
    if (!this.isConfigured()) {
      return { sent: false, provider: this.id, mode: 'stub' as const };
    }

    throw new Error(
      'Amazon SES is registered but sending is not enabled yet. Add @aws-sdk/client-ses and implement SesEmailProvider.send().',
    );
  }
}
