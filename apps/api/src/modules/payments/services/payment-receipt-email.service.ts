import { Injectable } from '@nestjs/common';

import { APP_SHORT_NAME } from '@community-marketplace/config';

import { LoggerLib } from '../../../libs/logger.lib';
import type { PaymentReceiptEmailContent } from '../templates/payment-receipt-email.template';

@Injectable()
export class PaymentReceiptEmailService {
  constructor(private readonly logger: LoggerLib) {}

  async sendReceiptEmail(
    to: string,
    content: PaymentReceiptEmailContent,
    attachment: Buffer,
    mimeType: 'application/pdf' = 'application/pdf',
  ): Promise<{ sent: boolean; mode: 'sendgrid' | 'stub' }> {
    const from = process.env.EMAIL_FROM ?? 'noreply@community.market';
    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    const attachmentBase64 = attachment.toString('base64');

    if (apiKey) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: APP_SHORT_NAME },
          subject: content.subject,
          content: [
            { type: 'text/plain', value: content.text },
            { type: 'text/html', value: content.html },
          ],
          attachments: [
            {
              content: attachmentBase64,
              filename: content.attachmentFilename,
              type: mimeType,
              disposition: 'attachment',
            },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.error(
          'PaymentReceiptEmailService',
          `SendGrid error ${response.status} for ${to}`,
          undefined,
          { detail: detail.slice(0, 500) },
        );
        throw new Error(`Failed to send payment receipt email (${response.status})`);
      }

      this.logger.log('PaymentReceiptEmailService', `Payment receipt email sent to ${to}`);
      return { sent: true, mode: 'sendgrid' };
    }

    this.logger.log(
      'PaymentReceiptEmailService',
      `Payment receipt email for ${to} (dev — set SENDGRID_API_KEY): ${content.subject}`,
    );
    return { sent: false, mode: 'stub' };
  }
}
