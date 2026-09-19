import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  acceptAdminInvitationSchema,
  adminInvitationTokenSchema,
} from '@community-marketplace/validation';

import { Public } from '../../common/decorators/public.decorator';
import { setRefreshTokenCookie } from '../auth/utils/auth-cookies';
import { computeDeviceFingerprint } from '../auth/utils/device-fingerprint';
import { AdminInvitationsService } from './admin-invitations.service';

@Controller('auth/admin-invite')
export class AdminInviteAuthController {
  constructor(private readonly invitations: AdminInvitationsService) {}

  @Public()
  @Post('preview')
  preview(@Body() body: unknown) {
    const dto = adminInvitationTokenSchema.parse(body);
    return this.invitations.previewInvitation(dto.token);
  }

  @Public()
  @Post('accept')
  async accept(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const dto = acceptAdminInvitationSchema.parse(body);
    const clientFingerprint = req.headers['x-device-fingerprint'];
    const fingerprintHeader = typeof clientFingerprint === 'string' ? clientFingerprint : undefined;
    const result = await this.invitations.acceptInvitation(dto.token, dto.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceFingerprint: computeDeviceFingerprint(
        req.headers['user-agent'],
        req.ip,
        fingerprintHeader,
      ),
    });
    setRefreshTokenCookie(res, result.login.refreshToken);
    return result;
  }
}
