import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  emailPlatformSettingsUpdateSchema,
  emailTestSendSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../common/decorators/rbac.decorator';
import { EmailSettingsService } from './email-settings.service';
import { EmailService } from './email.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/email')
export class AdminEmailController {
  constructor(
    private readonly emailSettings: EmailSettingsService,
    private readonly emailService: EmailService,
  ) {}

  @RequirePermissions(PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS)
  @Get('status')
  getStatus() {
    return this.emailSettings.getSystemStatus();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS)
  @Patch('settings')
  updateSettings(@Body() body: unknown) {
    const dto = emailPlatformSettingsUpdateSchema.parse(body);
    return this.emailSettings.update(dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS)
  @Post('test')
  async sendTest(@Body() body: unknown) {
    const dto = emailTestSendSchema.parse(body);
    const result = await this.emailService.send(
      {
        to: dto.to,
        subject: 'SellNearby test email',
        html: '<p>This is a test email from your SellNearby platform configuration.</p>',
        text: 'This is a test email from your SellNearby platform configuration.',
      },
      'AdminEmailController.sendTest',
    );
    return result;
  }
}
