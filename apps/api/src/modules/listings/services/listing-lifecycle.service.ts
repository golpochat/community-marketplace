import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Listing, ListingStatus, RbacRole } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { listingInclude, mapListing } from '../mappers/listing.mapper';
import { ListingAuditService } from './listing-audit.service';

const ALLOWED_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ['active', 'archived'],
  active: ['sold', 'archived', 'banned'],
  sold: ['archived'],
  archived: ['active'],
  banned: ['active'],
};

@Injectable()
export class ListingLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ListingAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async markSold(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
  ): Promise<Listing> {
    return this.transition(listingId, actorId, actorRole, 'sold');
  }

  async archive(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
  ): Promise<Listing> {
    return this.transition(listingId, actorId, actorRole, 'archived');
  }

  async unarchive(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
  ): Promise<Listing> {
    return this.transition(listingId, actorId, actorRole, 'active');
  }

  async ban(
    listingId: string,
    adminId: string,
    moderationNotes?: string,
  ): Promise<Listing> {
    const existing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!existing) throw new NotFoundException(`Listing ${listingId} not found`);

    const row = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'banned',
        bannedAt: new Date(),
        bannedById: adminId,
        moderationNotes,
      },
      include: listingInclude,
    });

    await this.audit.record(listingId, 'listing_banned', adminId, {
      fromStatus: existing.status as ListingStatus,
      toStatus: 'banned',
      metadata: { moderationNotes },
    });

    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });

    return mapListing(row);
  }

  async unban(listingId: string, adminId: string): Promise<Listing> {
    const existing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!existing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (existing.status !== 'banned') {
      throw new BadRequestException('Listing is not banned');
    }

    const row = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'active',
        bannedAt: null,
        bannedById: null,
      },
      include: listingInclude,
    });

    await this.audit.record(listingId, 'listing_unbanned', adminId, {
      fromStatus: 'banned',
      toStatus: 'active',
    });

    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });

    return mapListing(row);
  }

  private async transition(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
    toStatus: ListingStatus,
  ): Promise<Listing> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const isAdmin = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN';
    if (!isAdmin && listing.sellerId !== actorId) {
      throw new BadRequestException('You can only modify your own listings');
    }

    const fromStatus = listing.status as ListingStatus;
    if (!ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition listing from ${fromStatus} to ${toStatus}`,
      );
    }

    const row = await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: toStatus },
      include: listingInclude,
    });

    await this.audit.record(listingId, 'status_changed', actorId, {
      fromStatus,
      toStatus,
    });

    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });

    return mapListing(row);
  }
}
