import { Body, Controller, Get, Patch } from '@nestjs/common';

import { updateProfileSchema } from '@community-marketplace/validation';

import { RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@RequireRole('SELLER')
@Controller('seller/profile')
export class SellerProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch()
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    updateProfileSchema.parse(body);
    return this.usersService.updateProfile(user.id, user.role, user.id, body);
  }
}
