import { Injectable } from '@nestjs/common';

import { APP_SHORT_NAME } from '@community-marketplace/config';

import { LoggerLib } from '../../libs/logger.lib';
import {
  buildAdminInvitationEmailContent,
  type AdminInvitationEmailTemplateInput,
} from './templates/admin-invitation-email.template';

@Injectable()
export class AdminInvitationEmailService {
  constructor(private readonly logger: LoggerLib) {}

  async sendInvitationEmail(
    input: AdminInvitationEmailTemplateInput,
  ): Promise<{ sent: boolean; mode: 'sendgrid' | 'stub' }> {
    const from = process.env.EMAIL_FROM ?? 'noreply@sellnearby.ie';
    const { subject, html, text } = buildAdminInvitationEmailContent(input);

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
          'AdminInvitationEmailService',
          `SendGrid error ${response.status} for ${input.email}`,
          undefined,
          { detail: detail.slice(0, 500) },
        );
        throw new Error(`Failed to send admin invitation email (${response.status})`);
      }

      this.logger.log(
        'AdminInvitationEmailService',
        `Admin invitation email sent to ${input.email} via SendGrid`,
      );
      return { sent: true, mode: 'sendgrid' };
    }

    this.logger.log(
      'AdminInvitationEmailService',
      `Admin invitation for ${input.email} (dev — set SENDGRID_API_KEY to send): ${input.setupUrl}`,
    );
    return { sent: false, mode: 'stub' };
  }
}
