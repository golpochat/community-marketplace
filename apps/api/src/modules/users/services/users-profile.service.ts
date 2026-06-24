import { Injectable, NotFoundException } from '@nestjs/common';

import type { User, UserProfile } from '@community-marketplace/types';

import { devRoleIdFor } from '../../../common/constants/dev-role-ids';
import { UserProfileEntity } from '../entities/user-profile.entity';
import type { UpdateProfileDto } from '../dto/users.dto';

@Injectable()
export class UsersProfileService {
  private readonly profiles = new Map<string, UserProfileEntity>();

  constructor() {
    const seed = this.toEntity({
      id: 'user-1',
      email: 'admin@community.market',
      primaryRoleId: devRoleIdFor('ADMIN'),
      role: 'ADMIN',
      status: 'active',
      displayName: 'Admin User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.profiles.set(seed.userId, seed);
  }

  findByUserId(userId: string): UserProfileEntity {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }
    return profile;
  }

  update(userId: string, dto: UpdateProfileDto): UserProfileEntity {
    const profile = this.findByUserId(userId);
    Object.assign(profile, dto, { updatedAt: new Date() });
    this.profiles.set(userId, profile);
    return profile;
  }

  toProfile(entity: UserProfileEntity): UserProfile {
    return {
      id: entity.userId,
      email: entity.email,
      displayName: entity.displayName,
      avatarUrl: entity.avatarUrl,
      bio: entity.bio,
      location: entity.location,
      phone: entity.phone,
      primaryRoleId: entity.primaryRoleId,
      role: entity.role,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toEntity(user: User): UserProfileEntity {
    const entity = new UserProfileEntity();
    entity.id = `profile-${user.id}`;
    entity.userId = user.id;
    entity.email = user.email;
    entity.displayName = user.displayName;
    entity.avatarUrl = user.avatarUrl;
    entity.role = user.role;
    entity.primaryRoleId = user.primaryRoleId;
    entity.status = user.status;
    entity.createdAt = new Date(user.createdAt);
    entity.updatedAt = new Date(user.updatedAt);
    return entity;
  }
}
