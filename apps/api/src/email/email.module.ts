import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AdminEmailController } from './admin-email.controller';
import { EmailProviderRegistry } from './email-provider.registry';
import { EmailSettingsService } from './email-settings.service';
import { EmailService } from './email.service';
import { BrevoEmailProvider } from './providers/brevo.provider';
import { SendGridEmailProvider } from './providers/sendgrid.provider';
import { SesEmailProvider } from './providers/ses.provider';
import { StubEmailProvider } from './providers/stub.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminEmailController],
  providers: [
    BrevoEmailProvider,
    SendGridEmailProvider,
    SesEmailProvider,
    StubEmailProvider,
    EmailProviderRegistry,
    EmailSettingsService,
    EmailService,
  ],
  exports: [EmailService, EmailSettingsService],
})
export class EmailModule {}
