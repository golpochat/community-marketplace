import { Injectable } from '@nestjs/common';

import type { User } from '@community-marketplace/types';
import { paginationSchema } from '@community-marketplace/validation';

import { devRoleIdFor } from '../../common/constants/dev-role-ids';
import { ApiUtilsService } from '../../utils/api-utils.service';
import type { UpdateProfileDto, VerifyEmailDto, VerifyIdentityDto } from './dto/users.dto';
import { UsersProfileService } from './services/users-profile.service';
import { UsersVerificationService } from './services/users-verification.service';

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      id: 'user-1',
      email: 'admin@community.market',
      displayName: 'Admin User',
      primaryRoleId: devRoleIdFor('ADMIN'),
      role: 'ADMIN',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor(
    private readonly apiUtils: ApiUtilsService,
    private readonly profileService: UsersProfileService,
    private readonly verificationService: UsersVerificationService,
  ) {}

  findAll(page = 1, limit = 20) {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });
    return this.apiUtils.paginate(this.users, p, l);
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  updatePrimaryRole(userId: string, roleId: string, role: User['role']): User | undefined {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return undefined;
    user.primaryRoleId = roleId;
    user.role = role;
    user.updatedAt = new Date().toISOString();
    return user;
  }

  getProfile(userId: string) {
    const profile = this.profileService.findByUserId(userId);
    return this.profileService.toProfile(profile);
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = this.profileService.update(userId, dto);
    return this.profileService.toProfile(profile);
  }

  requestIdentityVerification(userId: string, dto: VerifyIdentityDto) {
    return this.verificationService.requestIdentityVerification(userId, dto);
  }

  verifyEmail(userId: string, dto: VerifyEmailDto) {
    return this.verificationService.verifyEmail(userId, dto);
  }

  getVerifications(userId: string) {
    return this.verificationService.getByUserId(userId);
  }
}
