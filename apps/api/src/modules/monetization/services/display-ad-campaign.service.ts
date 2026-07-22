import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  DisplayAdCampaign,
  DisplayAdCampaignStatus,
  DisplayAdCreative,
  DisplayAdPlacement,
} from '@community-marketplace/types';
import type {
  DisplayAdCampaignCreateInput,
  DisplayAdCampaignUpdateInput,
  DisplayAdCreativeUploadUrlInput,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { R2StorageService } from '../../users/services/r2-storage.service';

function mapCampaign(row: {
  id: string;
  advertiserName: string;
  advertiserEmail: string | null;
  advertiserNotes: string | null;
  placement: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  imageKey: string;
  imageUrl: string;
  clickUrl: string;
  altText: string | null;
  priority: number;
  createdByAdminId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DisplayAdCampaign {
  return {
    id: row.id,
    advertiserName: row.advertiserName,
    advertiserEmail: row.advertiserEmail ?? undefined,
    advertiserNotes: row.advertiserNotes ?? undefined,
    placement: row.placement as DisplayAdPlacement,
    status: row.status as DisplayAdCampaignStatus,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    imageKey: row.imageKey,
    imageUrl: row.imageUrl,
    clickUrl: row.clickUrl,
    altText: row.altText ?? undefined,
    priority: row.priority,
    createdByAdminId: row.createdByAdminId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === '') return null;
  return value.trim();
}

function resolvePublishStatus(startsAt: Date, endsAt: Date, now = new Date()): DisplayAdCampaignStatus {
  if (endsAt.getTime() <= now.getTime()) {
    return 'ended';
  }
  if (startsAt.getTime() > now.getTime()) {
    return 'scheduled';
  }
  return 'live';
}

@Injectable()
export class DisplayAdCampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2StorageService,
  ) {}

  async list(): Promise<DisplayAdCampaign[]> {
    const rows = await this.prisma.displayAdCampaign.findMany({
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map(mapCampaign);
  }

  async getById(id: string): Promise<DisplayAdCampaign> {
    const row = await this.prisma.displayAdCampaign.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Campaign not found');
    return mapCampaign(row);
  }

  async createUploadUrl(adminId: string, input: DisplayAdCreativeUploadUrlInput) {
    return this.r2.createSignedUploadUrl({
      category: 'system-assets',
      ownerId: `display-ads/${adminId}`,
      contentType: input.contentType,
      fileName: input.fileName,
    });
  }

  async create(
    adminId: string,
    input: DisplayAdCampaignCreateInput,
  ): Promise<DisplayAdCampaign> {
    this.assertImageKey(input.imageKey);
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('End date must be after start date');
    }

    const status: DisplayAdCampaignStatus = input.publish
      ? resolvePublishStatus(startsAt, endsAt)
      : 'draft';

    if (input.publish && status === 'ended') {
      throw new BadRequestException('Cannot publish a campaign whose end date is in the past');
    }

    const row = await this.prisma.displayAdCampaign.create({
      data: {
        advertiserName: input.advertiserName.trim(),
        advertiserEmail: emptyToNull(input.advertiserEmail) ?? null,
        advertiserNotes: emptyToNull(input.advertiserNotes) ?? null,
        placement: input.placement,
        status,
        startsAt,
        endsAt,
        imageKey: input.imageKey,
        imageUrl: input.imageUrl,
        clickUrl: input.clickUrl,
        altText: emptyToNull(input.altText) ?? null,
        priority: input.priority ?? 0,
        createdByAdminId: adminId,
      },
    });
    return mapCampaign(row);
  }

  async update(id: string, input: DisplayAdCampaignUpdateInput): Promise<DisplayAdCampaign> {
    const existing = await this.prisma.displayAdCampaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');
    if (existing.status === 'ended') {
      throw new BadRequestException('Ended campaigns cannot be edited');
    }
    if (input.imageKey) this.assertImageKey(input.imageKey);

    const startsAt = input.startsAt ? new Date(input.startsAt) : existing.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : existing.endsAt;
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('End date must be after start date');
    }

    let nextStatus = existing.status as DisplayAdCampaignStatus;
    if (nextStatus === 'live' || nextStatus === 'scheduled') {
      nextStatus = resolvePublishStatus(startsAt, endsAt);
    }

    const row = await this.prisma.displayAdCampaign.update({
      where: { id },
      data: {
        advertiserName: input.advertiserName?.trim(),
        advertiserEmail:
          input.advertiserEmail !== undefined
            ? emptyToNull(input.advertiserEmail) ?? null
            : undefined,
        advertiserNotes:
          input.advertiserNotes !== undefined
            ? emptyToNull(input.advertiserNotes) ?? null
            : undefined,
        placement: input.placement,
        startsAt: input.startsAt ? startsAt : undefined,
        endsAt: input.endsAt ? endsAt : undefined,
        imageKey: input.imageKey,
        imageUrl: input.imageUrl,
        clickUrl: input.clickUrl,
        altText:
          input.altText !== undefined ? emptyToNull(input.altText) ?? null : undefined,
        priority: input.priority,
        status: nextStatus,
      },
    });
    return mapCampaign(row);
  }

  async applyStatusAction(
    id: string,
    action: 'publish' | 'pause' | 'end',
  ): Promise<DisplayAdCampaign> {
    const existing = await this.prisma.displayAdCampaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');

    let status: DisplayAdCampaignStatus;
    if (action === 'end') {
      status = 'ended';
    } else if (action === 'pause') {
      if (existing.status === 'ended' || existing.status === 'draft') {
        throw new BadRequestException('Only published campaigns can be paused');
      }
      status = 'paused';
    } else {
      if (existing.status === 'ended') {
        throw new BadRequestException('Ended campaigns cannot be published');
      }
      status = resolvePublishStatus(existing.startsAt, existing.endsAt);
      if (status === 'ended') {
        throw new BadRequestException('Cannot publish a campaign whose end date is in the past');
      }
    }

    const row = await this.prisma.displayAdCampaign.update({
      where: { id },
      data: { status },
    });
    return mapCampaign(row);
  }

  /** Winning creative for a placement at `now`, or null. */
  async findActiveCreative(
    placement: DisplayAdPlacement,
    now = new Date(),
  ): Promise<DisplayAdCreative | null> {
    const row = await this.prisma.displayAdCampaign.findFirst({
      where: {
        placement,
        status: { in: ['live', 'scheduled'] },
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: [{ priority: 'desc' }, { startsAt: 'asc' }],
    });
    if (!row) return null;
    return {
      campaignId: row.id,
      imageUrl: row.imageUrl,
      clickUrl: row.clickUrl,
      altText: row.altText ?? undefined,
      advertiserName: row.advertiserName,
    };
  }

  private assertImageKey(key: string) {
    const normalized = key.replace(/\\/g, '/').trim();
    if (!normalized.startsWith('system-assets/')) {
      throw new BadRequestException('Invalid display ad image key');
    }
  }
}
