import { Injectable } from '@nestjs/common';

import { EmailService } from '../../../email/email.service';
import { LoggerLib } from '../../../libs/logger.lib';
import type { PaymentReceiptEmailContent } from '../templates/payment-receipt-email.template';

@Injectable()
export class PaymentReceiptEmailService {
  constructor(
    private readonly email: EmailService,
    private readonly logger: LoggerLib,
  ) {}

  async sendReceiptEmail(
    to: string,
    content: PaymentReceiptEmailContent,
    attachment: Buffer,
    mimeType: 'application/pdf' = 'application/pdf',
  ) {
    const result = await this.email.send(
      {
        to,
        subject: content.subject,
        html: content.html,
        text: content.text,
        attachments: [
          {
            filename: content.attachmentFilename,
            content: attachment,
            mimeType,
          },
        ],
      },
      'PaymentReceiptEmailService',
    );

    if (!result.sent) {
      this.logger.log(
        'PaymentReceiptEmailService',
        `Payment receipt email for ${to} (stub): ${content.subject}`,
      );
    }

    return {
      sent: result.sent,
      mode: result.mode === 'live' ? result.provider : ('stub' as const),
      provider: result.provider,
    };
  }
}
