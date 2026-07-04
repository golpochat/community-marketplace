import { Injectable } from '@nestjs/common';

import { EmailService } from '../../../email/email.service';
import { PlatformGovernanceService } from '../../platform/platform-governance.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { buildActivationEmailContent } from '../templates/activation-email.template';

export interface ActivationEmailInput {
  email: string;
  activationUrl: string;
  name?: string;
}

@Injectable()
export class ActivationEmailService {
  constructor(
    private readonly email: EmailService,
    private readonly governance: PlatformGovernanceService,
    private readonly logger: LoggerLib,
  ) {}

  async sendActivationEmail(input: ActivationEmailInput) {
    const supportEmail = await this.governance.getSupportEmail();
    const { subject, html, text } = buildActivationEmailContent({
      email: input.email,
      activationUrl: input.activationUrl,
      name: input.name,
      supportEmail,
      webAppUrl: process.env.WEB_APP_URL,
    });

    const result = await this.email.send(
      {
        to: input.email,
        subject,
        html,
        text,
      },
      'ActivationEmailService',
    );

    if (!result.sent) {
      this.logger.log(
        'ActivationEmailService',
        `Activation email for ${input.email} (stub — configure provider in admin): ${input.activationUrl}`,
      );
    } else if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        'ActivationEmailService',
        `Dev activation URL for ${input.email}: ${input.activationUrl}`,
      );
    }

    return {
      sent: result.sent,
      mode: result.mode === 'live' ? result.provider : ('stub' as const),
      provider: result.provider,
    };
  }
}
