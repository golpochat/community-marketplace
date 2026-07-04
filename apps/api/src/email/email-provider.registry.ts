import { Injectable } from '@nestjs/common';

import type { EmailProviderId } from '@community-marketplace/types';

import { BrevoEmailProvider } from './providers/brevo.provider';
import type { EmailProvider } from './providers/email-provider.interface';
import { SendGridEmailProvider } from './providers/sendgrid.provider';
import { SesEmailProvider } from './providers/ses.provider';
import { StubEmailProvider } from './providers/stub.provider';

@Injectable()
export class EmailProviderRegistry {
  private readonly providers: Map<EmailProviderId, EmailProvider>;

  constructor(
    brevo: BrevoEmailProvider,
    sendgrid: SendGridEmailProvider,
    ses: SesEmailProvider,
    stub: StubEmailProvider,
  ) {
    this.providers = new Map(
      [brevo, sendgrid, ses, stub].map((provider) => [provider.id, provider]),
    );
  }

  get(id: EmailProviderId): EmailProvider | undefined {
    return this.providers.get(id);
  }

  list(): EmailProvider[] {
    return Array.from(this.providers.values());
  }

  listConfigured(): EmailProvider[] {
    return this.list().filter((provider) => provider.isConfigured());
  }
}
