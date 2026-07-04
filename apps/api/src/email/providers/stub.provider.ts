import { Injectable } from '@nestjs/common';

import { LoggerLib } from '../../libs/logger.lib';
import type { EmailProvider, EmailSender, OutboundEmail } from './email-provider.interface';

@Injectable()
export class StubEmailProvider implements EmailProvider {
  readonly id = 'stub' as const;
  readonly label = 'Stub (dev)';
  readonly description = 'Logs emails instead of sending — for local development.';

  constructor(private readonly logger: LoggerLib) {}

  isConfigured(): boolean {
    return true;
  }

  async send(message: OutboundEmail, from: EmailSender) {
    this.logger.log(
      'StubEmailProvider',
      `[stub] Email from ${from.email} to ${message.to}: ${message.subject}`,
    );
    return { sent: false, provider: this.id, mode: 'stub' as const };
  }
}
