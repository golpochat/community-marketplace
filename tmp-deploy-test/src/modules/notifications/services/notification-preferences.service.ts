import { Injectable } from '@nestjs/common';

import type {
  NotificationChannel,
  NotificationType,
} from '@community-marketplace/types';
import type { NotificationPreferencesUpdateInput } from '@community-marketplace/validation';
import type { NotificationPreferences } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  inApp: true,
  sms: false,
  marketing: false,
  listingUpdates: true,
  messageAlerts: true,
  events: {},
};

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<NotificationPreferences> {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) return DEFAULT_PREFERENCES;
    return {
      ...DEFAULT_PREFERENCES,
      ...(settings.notificationPreferences as NotificationPreferences),
    };
  }

  async update(userId: string, input: NotificationPreferencesUpdateInput) {
    const current = await this.get(userId);
    const merged = {
      ...current,
      ...input,
      events: { ...current.events, ...input.events },
    };

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        notificationPreferences: merged,
      },
      update: {
        notificationPreferences: merged,
      },
    });

    return merged;
  }

  async shouldSend(
    userId: string,
    channel: NotificationChannel,
    type: NotificationType,
  ): Promise<boolean> {
    const prefs = await this.get(userId);

    if (prefs.events?.[type] === false) return false;
    if (prefs.events?.[type] === true) return true;

    if (channel === 'email' && prefs.email === false) return false;
    if (channel === 'push' && prefs.push === false) return false;
    if (channel === 'in_app' && prefs.inApp === false) return false;

    if (
      ['new_message', 'message_read', 'thread_created'].includes(type) &&
      prefs.messageAlerts === false
    ) {
      return false;
    }

    if (
      [
        'listing_sold',
        'listing_created',
        'listing_approved',
        'listing_rejected',
        'listing_expiring_soon',
        'listing_expired',
        'listing_removed',
        'listing_renewed',
        'listing_changes_requested',
        'listing_review_reply',
        'payment_received',
        'payment_refunded',
      ].includes(type) &&
      prefs.listingUpdates === false
    ) {
      return false;
    }

    if (type === 'system' && prefs.marketing === false) return false;

    return true;
  }

  resolveChannels(
    prefs: NotificationPreferences,
    requested?: NotificationChannel[],
  ): NotificationChannel[] {
    const channels = requested ?? ['in_app', 'push', 'email'];
    return channels.filter((channel) => {
      if (channel === 'email') return prefs.email !== false;
      if (channel === 'push') return prefs.push !== false;
      if (channel === 'in_app') return prefs.inApp !== false;
      return true;
    });
  }
}
