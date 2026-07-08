import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { PasswordResetEmailService } from '../services/password-reset-email.service';

@Injectable()
export class AuthPasswordResetListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly passwordResetEmail: PasswordResetEmailService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('user.password_reset_requested', (event) => {
      void this.handlePasswordResetEmail(event.payload);
    });
  }

  private async handlePasswordResetEmail(payload: Record<string, unknown>) {
    const email = typeof payload.email === 'string' ? payload.email : '';
    const resetUrl = typeof payload.resetUrl === 'string' ? payload.resetUrl : '';
    const name = typeof payload.name === 'string' ? payload.name : undefined;

    if (!email || !resetUrl) {
      this.logger.warn('AuthPasswordResetListener', 'Missing password reset email fields', {
        email,
        hasUrl: Boolean(resetUrl),
      });
      return;
    }

    try {
      await this.passwordResetEmail.sendPasswordResetEmail({ email, resetUrl, name });
    } catch (error) {
      this.logger.error(
        'AuthPasswordResetListener',
        `Failed to send password reset email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
