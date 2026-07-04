import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

import type { EmailProvider } from './email-provider.interface';
import type { EmailSender, OutboundEmail } from './email-provider.interface';

@Injectable()
export class BrevoEmailProvider implements EmailProvider {
  readonly id = 'brevo' as const;
  readonly label = 'Brevo';
  readonly description = 'Transactional email via Brevo API (BREVO_API_KEY in API .env).';

  constructor(private readonly config: ConfigService) {}

  private getClient(): BrevoClient | null {
    const apiKey = this.config.get<string>('BREVO_API_KEY')?.trim();
    return apiKey ? new BrevoClient({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('BREVO_API_KEY')?.trim());
  }

  async send(message: OutboundEmail, from: EmailSender) {
    const client = this.getClient();
    if (!client) {
      return { sent: false, provider: this.id, mode: 'stub' as const };
    }

    const response = await client.transactionalEmails.sendTransacEmail({
      sender: { email: from.email, name: from.name },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
    });

    return {
      sent: true,
      provider: this.id,
      mode: 'live' as const,
      messageId: response.messageId,
    };
  }
}
