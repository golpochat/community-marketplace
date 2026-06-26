import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { NotificationChannel } from '@community-marketplace/types';
import type { NotificationTemplateInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { RedisCacheService } from '../../../libs/redis-cache.service';
import { mapTemplate } from '../mappers/notification.mapper';
import { NotificationTemplateEngineService } from './notification-template-engine.service';

const CACHE_TTL_SECONDS = 300;

const DEFAULT_TEMPLATES: NotificationTemplateInput[] = [
  {
    key: 'new_message',
    titleTemplate: 'New message from {{sender_name}}',
    bodyTemplate: '{{sender_name}} sent you a message.',
    channel: 'in_app',
    variables: ['sender_name'],
  },
  {
    key: 'new_message',
    titleTemplate: 'New message from {{sender_name}}',
    bodyTemplate: '{{sender_name}} sent you a message.',
    channel: 'push',
    variables: ['sender_name'],
  },
  {
    key: 'payment_received',
    titleTemplate: 'Payment received',
    bodyTemplate: 'You received a payment for your listing.',
    channel: 'in_app',
  },
  {
    key: 'payment_failed',
    titleTemplate: 'Payment failed',
    bodyTemplate: 'Your payment could not be processed.',
    channel: 'in_app',
  },
  {
    key: 'listing_sold',
    titleTemplate: 'Listing sold',
    bodyTemplate: 'Your listing "{{listing_title}}" has been sold.',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'listing_created',
    titleTemplate: 'New listing nearby',
    bodyTemplate: 'A new listing "{{listing_title}}" was posted.',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'listing_approved',
    titleTemplate: 'Listing approved',
    bodyTemplate: 'Your listing "{{listing_title}}" has been approved and is now live.',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'listing_rejected',
    titleTemplate: 'Listing rejected',
    bodyTemplate: 'Your listing "{{listing_title}}" was rejected: {{reason}}',
    channel: 'in_app',
    variables: ['listing_title', 'reason'],
  },
  {
    key: 'listing_rejected',
    titleTemplate: 'Listing rejected',
    bodyTemplate: 'Your listing "{{listing_title}}" was rejected: {{reason}}',
    channel: 'email',
    variables: ['listing_title', 'reason'],
  },
  {
    key: 'listing_expiring_soon',
    titleTemplate: 'Listing expiring soon',
    bodyTemplate: 'Your listing "{{listing_title}}" will expire soon.',
    channel: 'in_app',
    variables: ['listing_title', 'expires_at'],
  },
  {
    key: 'listing_expired',
    titleTemplate: 'Listing expired',
    bodyTemplate: 'Your listing "{{listing_title}}" has expired. Renew it to go live again.',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'listing_removed',
    titleTemplate: 'Listing removed',
    bodyTemplate: 'Your listing "{{listing_title}}" was removed: {{reason}}',
    channel: 'in_app',
    variables: ['listing_title', 'reason'],
  },
  {
    key: 'listing_renewed',
    titleTemplate: 'Listing renewed',
    bodyTemplate: 'Your listing "{{listing_title}}" is live again.',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'listing_changes_requested',
    titleTemplate: 'Listing changes requested',
    bodyTemplate: 'An admin requested changes to "{{listing_title}}": {{message}}',
    channel: 'in_app',
    variables: ['listing_title', 'message'],
  },
  {
    key: 'listing_changes_requested',
    titleTemplate: 'Listing changes requested',
    bodyTemplate: 'An admin requested changes to "{{listing_title}}": {{message}}',
    channel: 'email',
    variables: ['listing_title', 'message'],
  },
  {
    key: 'listing_review_reply',
    titleTemplate: 'Seller replied to listing review',
    bodyTemplate: 'The seller replied about "{{listing_title}}": {{message}}',
    channel: 'in_app',
    variables: ['listing_title', 'message'],
  },
  {
    key: 'verification_approved',
    titleTemplate: 'Verification approved',
    bodyTemplate: 'Your seller verification has been approved.',
    channel: 'in_app',
  },
  {
    key: 'verification_rejected',
    titleTemplate: 'Verification rejected',
    bodyTemplate: 'Your verification was rejected. Reason: {{reason}}',
    channel: 'in_app',
    variables: ['reason'],
  },
  {
    key: 'seller_verification_nudge',
    titleTemplate: 'Complete seller verification',
    bodyTemplate: '{{message}}',
    channel: 'in_app',
    variables: ['message'],
  },
  {
    key: 'seller_verification_nudge',
    titleTemplate: 'Complete seller verification',
    bodyTemplate: '{{message}}',
    channel: 'email',
    variables: ['message'],
  },
  {
    key: 'seller_suspended',
    titleTemplate: 'Seller account suspended',
    bodyTemplate: '{{message}}',
    channel: 'in_app',
    variables: ['message', 'reason', 'duration'],
  },
  {
    key: 'seller_suspended',
    titleTemplate: 'Seller account suspended',
    bodyTemplate: '{{message}}',
    channel: 'email',
    variables: ['message', 'reason', 'duration'],
  },
  {
    key: 'seller_reactivated',
    titleTemplate: 'Seller account reactivated',
    bodyTemplate: '{{message}}',
    channel: 'in_app',
    variables: ['message', 'reason'],
  },
  {
    key: 'seller_reactivated',
    titleTemplate: 'Seller account reactivated',
    bodyTemplate: '{{message}}',
    channel: 'email',
    variables: ['message', 'reason'],
  },
  {
    key: 'seller_force_reverify',
    titleTemplate: 'Re-verification required',
    bodyTemplate: '{{message}}',
    channel: 'in_app',
    variables: ['message', 'reason'],
  },
  {
    key: 'seller_force_reverify',
    titleTemplate: 'Re-verification required',
    bodyTemplate: '{{message}}',
    channel: 'email',
    variables: ['message', 'reason'],
  },
  {
    key: 'admin_warning',
    titleTemplate: 'Account warning',
    bodyTemplate: '{{message}}',
    channel: 'in_app',
    variables: ['message'],
  },
  {
    key: 'refund_requested',
    titleTemplate: 'Refund requested',
    bodyTemplate: 'A buyer requested a refund.',
    channel: 'in_app',
  },
  {
    key: 'admin_broadcast',
    titleTemplate: '{{title}}',
    bodyTemplate: '{{message}}',
    channel: 'in_app',
    variables: ['title', 'message'],
  },
  {
    key: 'admin_broadcast',
    titleTemplate: '{{title}}',
    bodyTemplate: '{{message}}',
    channel: 'push',
    variables: ['title', 'message'],
  },
  {
    key: 'dispute_opened',
    titleTemplate: 'Dispute opened',
    bodyTemplate: 'A buyer opened a dispute for "{{listing_title}}".',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'dispute_response',
    titleTemplate: 'Seller responded to dispute',
    bodyTemplate: 'The seller responded to your dispute for "{{listing_title}}".',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'dispute_evidence_requested',
    titleTemplate: 'More evidence needed',
    bodyTemplate: 'Additional evidence is requested for the dispute on "{{listing_title}}".',
    channel: 'in_app',
    variables: ['listing_title'],
  },
  {
    key: 'dispute_resolved',
    titleTemplate: 'Dispute resolved',
    bodyTemplate: 'Your dispute for "{{listing_title}}" was {{outcome}}.',
    channel: 'in_app',
    variables: ['listing_title', 'outcome'],
  },
];

@Injectable()
export class NotificationTemplatesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
    private readonly engine: NotificationTemplateEngineService,
  ) {}

  async onModuleInit() {
    for (const template of DEFAULT_TEMPLATES) {
      const existing = await this.prisma.notificationTemplate.findFirst({
        where: { key: template.key, channel: template.channel, version: 1 },
      });
      if (!existing) {
        await this.create(template);
      }
    }
  }

  async create(input: NotificationTemplateInput) {
    const latest = await this.prisma.notificationTemplate.findFirst({
      where: { key: input.key, channel: input.channel },
      orderBy: { version: 'desc' },
    });
    const version = (latest?.version ?? 0) + 1;

    const row = await this.prisma.notificationTemplate.create({
      data: {
        key: input.key,
        titleTemplate: input.titleTemplate,
        bodyTemplate: input.bodyTemplate,
        channel: input.channel,
        variables: input.variables as Prisma.InputJsonValue | undefined,
        version,
      },
    });

    await this.invalidateCache(input.key, input.channel);
    return mapTemplate(row);
  }

  async list(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        orderBy: [{ key: 'asc' }, { version: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.notificationTemplate.count(),
    ]);
    return {
      data: rows.map(mapTemplate),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getLatest(key: string, channel: NotificationChannel, version?: number) {
    const cacheKey = `notification:template:${key}:${channel}:${version ?? 'latest'}`;
    const cached = await this.cache.get<ReturnType<typeof mapTemplate>>(cacheKey);
    if (cached) return cached;

    const row = await this.prisma.notificationTemplate.findFirst({
      where: {
        key,
        channel,
        ...(version ? { version } : {}),
      },
      orderBy: { version: 'desc' },
    });
    if (!row) throw new NotFoundException(`Template ${key}/${channel} not found`);

    const mapped = mapTemplate(row);
    await this.cache.set(cacheKey, mapped, CACHE_TTL_SECONDS);
    return mapped;
  }

  async preview(input: {
    key: string;
    channel: NotificationChannel;
    variables?: Record<string, string>;
    version?: number;
  }) {
    const template = await this.getLatest(input.key, input.channel, input.version);
    return this.engine.preview(
      template.titleTemplate,
      template.bodyTemplate,
      input.variables ?? {},
    );
  }

  private async invalidateCache(key: string, channel: NotificationChannel) {
    await this.cache.del(`notification:template:${key}:${channel}:latest`);
  }
}
