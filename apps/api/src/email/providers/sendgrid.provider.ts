import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoggerLib } from '../../libs/logger.lib';
import type { EmailProvider, EmailSender, OutboundEmail } from './email-provider.interface';

@Injectable()
export class SendGridEmailProvider implements EmailProvider {
  readonly id = 'sendgrid' as const;
  readonly label = 'SendGrid';
  readonly description = 'Transactional email via SendGrid API (SENDGRID_API_KEY in API .env).';

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerLib,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('SENDGRID_API_KEY')?.trim());
  }

  async send(message: OutboundEmail, from: EmailSender) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY')?.trim();
    if (!apiKey) {
      return { sent: false, provider: this.id, mode: 'stub' as const };
    }

    const content: Array<{ type: string; value: string }> = [];
    if (message.text) {
      content.push({ type: 'text/plain', value: message.text });
    }
    content.push({ type: 'text/html', value: message.html });

    const body: Record<string, unknown> = {
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: from.email, name: from.name },
      subject: message.subject,
      content,
    };

    if (message.attachments?.length) {
      body.attachments = message.attachments.map((attachment) => ({
        content: attachment.content.toString('base64'),
        filename: attachment.filename,
        type: attachment.mimeType,
        disposition: 'attachment',
      }));
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(
        'SendGridEmailProvider',
        `SendGrid error ${response.status} for ${message.to}`,
        undefined,
        { detail: detail.slice(0, 500) },
      );
      throw new Error(`SendGrid send failed (${response.status})`);
    }

    return { sent: true, provider: this.id, mode: 'live' as const };
  }
}
