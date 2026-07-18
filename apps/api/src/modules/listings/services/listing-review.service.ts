import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ListingReviewContext,
  ListingReviewMessage,
  RbacRole,
} from '@community-marketplace/types';
import {
  listingReviewMessageSchema,
  requestListingChangesSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { listingInclude, mapListing } from '../mappers/listing.mapper';
import { ListingAuditService } from './listing-audit.service';

function isAdminRole(role: RbacRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

@Injectable()
export class ListingReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ListingAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async getReviewContext(
    listingId: string,
    actorId: string,
    role: RbacRole,
  ): Promise<ListingReviewContext> {
    const listing = await this.assertCanAccess(listingId, actorId, role);
    const messages = await this.listMessages(listingId, listing.sellerId);
    return { listing, messages };
  }

  async addMessage(
    listingId: string,
    senderId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<ListingReviewContext> {
    const listing = await this.assertCanAccess(listingId, senderId, role);
    const parsed = listingReviewMessageSchema.parse(input);

    const isSellerActor = role === 'SELLER' || role === 'MEMBER' || role === 'BUYER';
    if (
      isSellerActor &&
      listing.sellerId === senderId &&
      !['draft', 'pending_review', 'rejected'].includes(listing.status)
    ) {
      throw new BadRequestException('Review replies are only allowed during the review process');
    }

    await this.prisma.listingReviewMessage.create({
      data: {
        listingId,
        senderId,
        content: parsed.content.trim(),
      },
    });

    if (isSellerActor && listing.sellerId === senderId) {
      const adminId = await this.findLastAdminReviewerId(listingId, listing.sellerId);
      if (adminId) {
        this.eventBus.publish({
          type: 'listing.review_reply',
          payload: { listingId, sellerId: listing.sellerId, adminId, message: parsed.content },
          timestamp: new Date(),
        });
      }
    }

    return this.getReviewContext(listingId, senderId, role);
  }

  async requestChanges(
    listingId: string,
    adminId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<ListingReviewContext> {
    if (!isAdminRole(role)) {
      throw new ForbiddenException('Only administrators can request listing changes');
    }

    const parsed = requestListingChangesSchema.parse(input);
    const listing = await this.assertCanAccess(listingId, adminId, role);

    if (!['draft', 'pending_review'].includes(listing.status)) {
      throw new BadRequestException('Changes can only be requested on listings under review');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: { moderationNotes: parsed.content.trim() },
      });
      await tx.listingReviewMessage.create({
        data: {
          listingId,
          senderId: adminId,
          content: parsed.content.trim(),
        },
      });
    });

    await this.audit.record(listingId, 'listing_changes_requested', adminId, {
      fromStatus: 'draft',
      toStatus: 'draft',
      metadata: { message: parsed.content.trim() },
    });

    this.eventBus.publish({
      type: 'listing.changes_requested',
      payload: {
        listingId,
        sellerId: listing.sellerId,
        adminId,
        message: parsed.content.trim(),
        ...(parsed.targetStep ? { targetStep: parsed.targetStep } : {}),
      },
      timestamp: new Date(),
    });

    return this.getReviewContext(listingId, adminId, role);
  }

  private async assertCanAccess(listingId: string, actorId: string, role: RbacRole) {
    const row = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: listingInclude,
    });
    if (!row) throw new NotFoundException(`Listing ${listingId} not found`);

    const listing = mapListing(row);
    const isAdmin = isAdminRole(role);
    const isOwner = listing.sellerId === actorId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You cannot access this listing review');
    }

    return listing;
  }

  private async listMessages(
    listingId: string,
    sellerId: string,
  ): Promise<ListingReviewMessage[]> {
    const rows = await this.prisma.listingReviewMessage.findMany({
      where: { listingId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            primaryRole: { select: { code: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      listingId: row.listingId,
      senderId: row.senderId,
      senderName: row.sender.email.split('@')[0],
      senderRole: row.sender.primaryRole.code as RbacRole,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private async findLastAdminReviewerId(listingId: string, sellerId: string) {
    const row = await this.prisma.listingReviewMessage.findFirst({
      where: {
        listingId,
        senderId: { not: sellerId },
      },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true },
    });
    return row?.senderId;
  }
}
