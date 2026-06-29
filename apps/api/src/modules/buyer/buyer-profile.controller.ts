import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { updateProfileSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateReportDto } from '../moderation/dto/moderation.dto';
import { ModerationService } from '../moderation/moderation.service';
import { UsersService } from '../users/users.service';

@RequireRole('BUYER')
@Controller('buyer')
export class BuyerProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly moderationService: ModerationService,
  ) {}

  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    updateProfileSchema.parse(body);
    return this.usersService.updateProfile(user.id, user.role, user.id, body);
  }

  @Post('reports')
  createReport(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(user.id, dto);
  }
}
