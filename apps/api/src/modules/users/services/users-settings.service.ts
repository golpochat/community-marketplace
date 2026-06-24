import { Injectable, NotFoundException } from '@nestjs/common';

import type { UserSettings } from '@community-marketplace/types';
import {
  PLATFORM_LANGUAGE,
  PLATFORM_TIMEZONE,
} from '@community-marketplace/config';
import {
  updateUserSettingsSchema,
  type UpdateUserSettingsInput,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { UserAuditService } from './user-audit.service';

const defaultSettings = {
  notificationPreferences: {
    email: true,
    push: true,
    inApp: true,
    sms: false,
    marketing: false,
    listingUpdates: true,
    messageAlerts: true,
  },
  privacySettings: {
    showEmail: false,
    showPhone: false,
    showLocation: true,
    profileVisibility: 'members' as const,
  },
  communicationPreferences: {
    preferredChannel: 'email' as const,
    language: PLATFORM_LANGUAGE,
    timezone: PLATFORM_TIMEZONE,
  },
};

@Injectable()
export class UsersSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: UserAuditService,
  ) {}

  async getSettings(userId: string): Promise<UserSettings> {
    const settings = await this.ensureSettings(userId);
    return this.toDto(settings);
  }

  async updateSettings(userId: string, input: UpdateUserSettingsInput): Promise<UserSettings> {
    const parsed = updateUserSettingsSchema.parse(input);
    const current = await this.ensureSettings(userId);

    const updated = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        notificationPreferences: parsed.notificationPreferences
          ? { ...(current.notificationPreferences as object), ...parsed.notificationPreferences }
          : undefined,
        privacySettings: parsed.privacySettings
          ? { ...(current.privacySettings as object), ...parsed.privacySettings }
          : undefined,
        communicationPreferences: parsed.communicationPreferences
          ? {
              ...(current.communicationPreferences as object),
              ...parsed.communicationPreferences,
            }
          : undefined,
      },
    });

    await this.audit.record('settings_updated', userId, userId, { fields: Object.keys(parsed) });
    return this.toDto(updated);
  }

  async requestDeletion(userId: string) {
    await this.ensureSettings(userId);
    const updated = await this.prisma.userSettings.update({
      where: { userId },
      data: { deletionRequestedAt: new Date() },
    });

    await this.audit.record('deletion_requested', userId, userId);
    return {
      deletionRequestedAt: updated.deletionRequestedAt?.toISOString(),
      message: 'Account deletion request recorded. Support will process within 30 days.',
    };
  }

  private async ensureSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        notificationPreferences: defaultSettings.notificationPreferences,
        privacySettings: defaultSettings.privacySettings,
        communicationPreferences: defaultSettings.communicationPreferences,
      },
      update: {},
    });
  }

  private toDto(row: {
    userId: string;
    notificationPreferences: unknown;
    privacySettings: unknown;
    communicationPreferences: unknown;
    deletionRequestedAt: Date | null;
    updatedAt: Date;
  }): UserSettings {
    return {
      userId: row.userId,
      notificationPreferences: row.notificationPreferences as UserSettings['notificationPreferences'],
      privacySettings: row.privacySettings as UserSettings['privacySettings'],
      communicationPreferences:
        row.communicationPreferences as UserSettings['communicationPreferences'],
      deletionRequestedAt: row.deletionRequestedAt?.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
