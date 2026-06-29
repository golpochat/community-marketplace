import { Injectable } from '@nestjs/common';

import { APP_SHORT_NAME } from '@community-marketplace/config';

import { LoggerLib } from '../../../libs/logger.lib';
import { buildActivationEmailContent } from '../templates/activation-email.template';

export interface ActivationEmailInput {
  email: string;
  activationUrl: string;
  name?: string;
}

@Injectable()
export class ActivationEmailService {
  constructor(private readonly logger: LoggerLib) {}

  async sendActivationEmail(input: ActivationEmailInput): Promise<{ sent: boolean; mode: 'sendgrid' | 'stub' }> {
    const from = process.env.EMAIL_FROM ?? 'noreply@community.market';
    const { subject, html, text } = buildActivationEmailContent({
      email: input.email,
      activationUrl: input.activationUrl,
      name: input.name,
      supportEmail: process.env.SUPPORT_EMAIL,
      webAppUrl: process.env.WEB_APP_URL,
    });

    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    if (apiKey) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: input.email }] }],
          from: { email: from, name: APP_SHORT_NAME },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.error(
          'ActivationEmailService',
          `SendGrid error ${response.status} for ${input.email}`,
          undefined,
          { detail: detail.slice(0, 500) },
        );
        throw new Error(`Failed to send activation email (${response.status})`);
      }

      this.logger.log('ActivationEmailService', `Activation email sent to ${input.email} via SendGrid`);

      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(
          'ActivationEmailService',
          `Dev activation URL for ${input.email}: ${input.activationUrl}`,
        );
      }

      return { sent: true, mode: 'sendgrid' };
    }

    this.logger.log(
      'ActivationEmailService',
      `Activation email for ${input.email} (dev — set SENDGRID_API_KEY to send for real): ${input.activationUrl}`,
    );
    return { sent: false, mode: 'stub' };
  }
}
