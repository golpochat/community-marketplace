import { Injectable } from '@nestjs/common';

import { EmailService } from '../../../email/email.service';
import { PlatformGovernanceService } from '../../platform/platform-governance.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { buildPasswordResetEmailContent } from '../templates/password-reset-email.template';

export interface PasswordResetEmailInput {
  email: string;
  resetUrl: string;
  name?: string;
}

@Injectable()
export class PasswordResetEmailService {
  constructor(
    private readonly email: EmailService,
    private readonly governance: PlatformGovernanceService,
    private readonly logger: LoggerLib,
  ) {}

  async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    const supportEmail = await this.governance.getSupportEmail();
    const { subject, html, text } = buildPasswordResetEmailContent({
      email: input.email,
      resetUrl: input.resetUrl,
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
      'PasswordResetEmailService',
    );

    if (!result.sent) {
      this.logger.log(
        'PasswordResetEmailService',
        `Password reset email for ${input.email} (stub — configure provider in admin): ${input.resetUrl}`,
      );
    } else if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        'PasswordResetEmailService',
        `Dev password reset URL for ${input.email}: ${input.resetUrl}`,
      );
    }

    return {
      sent: result.sent,
      mode: result.mode === 'live' ? result.provider : ('stub' as const),
      provider: result.provider,
    };
  }
}
