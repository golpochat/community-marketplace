import { Injectable } from '@nestjs/common';

import { EmailService } from '../../email/email.service';
import { LoggerLib } from '../../libs/logger.lib';
import {
  buildAdminInvitationEmailContent,
  type AdminInvitationEmailTemplateInput,
} from './templates/admin-invitation-email.template';

@Injectable()
export class AdminInvitationEmailService {
  constructor(
    private readonly email: EmailService,
    private readonly logger: LoggerLib,
  ) {}

  async sendInvitationEmail(input: AdminInvitationEmailTemplateInput) {
    const { subject, html, text } = buildAdminInvitationEmailContent(input);

    const result = await this.email.send(
      {
        to: input.email,
        subject,
        html,
        text,
      },
      'AdminInvitationEmailService',
    );

    if (!result.sent) {
      this.logger.log(
        'AdminInvitationEmailService',
        `Admin invitation for ${input.email} (stub): ${input.setupUrl}`,
      );
    }

    return {
      sent: result.sent,
      mode: result.mode === 'live' ? result.provider : ('stub' as const),
      provider: result.provider,
    };
  }
}
