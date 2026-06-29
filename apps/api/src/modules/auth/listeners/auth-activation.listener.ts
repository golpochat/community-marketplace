import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { ActivationEmailService } from '../services/activation-email.service';

@Injectable()
export class AuthActivationListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly activationEmail: ActivationEmailService,
    private readonly logger: LoggerLib,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('user.registration_pending', (event) => {
      void this.handleActivationEmail(event.payload, 'registration');
    });
    this.eventBus.subscribe('user.activation_resent', (event) => {
      void this.handleActivationEmail(event.payload, 'resend');
    });
  }

  private async handleActivationEmail(
    payload: Record<string, unknown>,
    source: 'registration' | 'resend',
  ) {
    const email = typeof payload.email === 'string' ? payload.email : '';
    const activationUrl = typeof payload.activationUrl === 'string' ? payload.activationUrl : '';
    const name = typeof payload.name === 'string' ? payload.name : undefined;

    if (!email || !activationUrl) {
      this.logger.warn('AuthActivationListener', `Missing activation email fields (${source})`, {
        email,
        hasUrl: Boolean(activationUrl),
      });
      return;
    }

    try {
      await this.activationEmail.sendActivationEmail({ email, activationUrl, name });
    } catch (error) {
      this.logger.error(
        'AuthActivationListener',
        `Failed to send activation email (${source}) to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
