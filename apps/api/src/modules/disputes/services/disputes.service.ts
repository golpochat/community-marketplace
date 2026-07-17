import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type { DisputeEvidenceUploaderRole, MarketplaceDisputeStatus } from '@prisma/client';

import type { MarketplaceDispute, PaginatedResult } from '@community-marketplace/types';
import {
  adminRequestEvidenceSchema,
  adminResolveDisputeSchema,
  adminDisputeListQuerySchema,
  createDisputeSchema,
  disputeListQuerySchema,
  disputeRespondSchema,
  disputeUploadEvidenceSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { resolveAssetPublicUrl } from '../../../libs/asset-url.lib';
import { NotificationDispatcherService } from '../../notifications/services/notification-dispatcher.service';
import { R2StorageService } from '../../users/services/r2-storage.service';
import { mapDispute } from '../mappers/dispute.mapper';
import { DisputeAccessService } from './dispute-access.service';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: DisputeAccessService,
    private readonly storage: R2StorageService,
    private readonly notifications: NotificationDispatcherService,
  ) {}

  async create(buyerId: string, input: unknown): Promise<MarketplaceDispute> {
    const parsed = createDisputeSchema.parse(input);
    const payment = await this.access.assertBuyerOnListing(
      buyerId,
      parsed.listingId,
      parsed.paymentId,
    );

    const dispute = await this.prisma.marketplaceDispute.create({
      data: {
        buyerId,
        sellerId: payment.sellerId,
        listingId: parsed.listingId,
        paymentId: payment.id,
        reason: parsed.reason,
        description: parsed.description,
        disputeStatus: 'open',
      },
      include: this.detailInclude(),
    });

    const listing = dispute.listing;
    await this.notifications.dispatch({
      userId: payment.sellerId,
      type: 'admin_warning',
      templateKey: 'dispute_opened',
      variables: {
        listing_title: listing?.title ?? 'your listing',
      },
      actionUrl: `/account/disputes/${dispute.id}`,
      data: { disputeId: dispute.id, listingId: parsed.listingId },
    });

    return this.mapWithUrls(dispute);
  }

  async uploadEvidence(
    userId: string,
    role: 'BUYER' | 'SELLER' | 'MEMBER' | 'ADMIN',
    input: unknown,
  ) {
    const parsed = disputeUploadEvidenceSchema.parse(input);
    const dispute = await this.access.getDisputeOrThrow(parsed.disputeId);

    const participantRole =
      role === 'MEMBER'
        ? this.access.resolveParticipantSide(dispute, userId)
        : role;

    if (participantRole === 'BUYER') {
      this.access.assertBuyer(dispute, userId);
    } else if (participantRole === 'SELLER') {
      this.access.assertSeller(dispute, userId);
    } else {
      throw new BadRequestException('Use the admin endpoint for admin evidence uploads');
    }

    this.access.assertCanAddEvidence(dispute.disputeStatus);

    if ('filePath' in parsed) {
      if (!this.storage.verifyDisputeEvidenceKey(parsed.filePath, userId)) {
        throw new BadRequestException('Invalid evidence file path');
      }

      const uploaderRole: DisputeEvidenceUploaderRole =
        participantRole === 'BUYER' ? 'buyer' : 'seller';

      const evidence = await this.prisma.disputeEvidence.create({
        data: {
          disputeId: parsed.disputeId,
          uploadedById: userId,
          uploaderRole,
          filePath: parsed.filePath,
          description: parsed.description,
        },
      });

      return {
        stored: true,
        evidenceId: evidence.id,
        filePath: evidence.filePath,
        fileUrl: resolveAssetPublicUrl(evidence.filePath),
      };
    }

    return this.storage.createDisputeEvidenceUploadUrl(
      userId,
      parsed.contentType,
      parsed.fileName,
    );
  }

  async respond(sellerId: string, input: unknown): Promise<MarketplaceDispute> {
    const parsed = disputeRespondSchema.parse(input);
    const dispute = await this.access.getDisputeOrThrow(parsed.disputeId);
    this.access.assertSeller(dispute, sellerId);
    this.access.assertCanAddEvidence(dispute.disputeStatus);

    if (parsed.filePath && !this.storage.verifyDisputeEvidenceKey(parsed.filePath, sellerId)) {
      throw new BadRequestException('Invalid evidence file path');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.disputeMessage.create({
        data: {
          disputeId: parsed.disputeId,
          senderId: sellerId,
          messageText: parsed.messageText,
        },
      });

      if (parsed.filePath) {
        await tx.disputeEvidence.create({
          data: {
            disputeId: parsed.disputeId,
            uploadedById: sellerId,
            uploaderRole: 'seller',
            filePath: parsed.filePath,
            description: parsed.evidenceDescription,
          },
        });
      }
    });

    const listing = dispute.listing;
    await this.notifications.dispatch({
      userId: dispute.buyerId,
      type: 'admin_warning',
      templateKey: 'dispute_response',
      variables: {
        listing_title: listing?.title ?? 'your purchase',
      },
      actionUrl: `/account/disputes/${dispute.id}`,
      data: { disputeId: dispute.id },
    });

    return this.getDetail(parsed.disputeId, sellerId, 'SELLER');
  }

  async listForUser(
    userId: string,
    role: 'BUYER' | 'SELLER' | 'MEMBER',
    query: Record<string, string>,
  ): Promise<PaginatedResult<MarketplaceDispute>> {
    const parsed = disputeListQuerySchema.parse(query);
    const statusFilter = parsed.status ? { disputeStatus: parsed.status } : {};
    const where =
      role === 'BUYER'
        ? { buyerId: userId, ...statusFilter }
        : role === 'SELLER'
          ? { sellerId: userId, ...statusFilter }
          : {
              OR: [{ buyerId: userId }, { sellerId: userId }],
              ...statusFilter,
            };

    const [rows, total] = await Promise.all([
      this.prisma.marketplaceDispute.findMany({
        where,
        include: this.listInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
      }),
      this.prisma.marketplaceDispute.count({ where }),
    ]);

    return {
      data: rows.map((row) => mapDispute(row)),
      meta: {
        page: parsed.page,
        limit: parsed.limit,
        total,
      },
    };
  }

  async getDetail(
    disputeId: string,
    userId: string,
    role: 'BUYER' | 'SELLER' | 'MEMBER' | 'ADMIN' | 'SUPER_ADMIN',
  ): Promise<MarketplaceDispute> {
    const dispute = await this.access.getDisputeOrThrow(disputeId);

    if (role === 'BUYER' || role === 'SELLER' || role === 'MEMBER') {
      this.access.assertParticipant(dispute, userId);
    }

    return this.mapWithUrls(dispute);
  }

  async listForAdmin(query: Record<string, string>): Promise<PaginatedResult<MarketplaceDispute>> {
    const parsed = adminDisputeListQuerySchema.parse(query);
    const where = parsed.status ? { disputeStatus: parsed.status } : {};

    const [rows, total] = await Promise.all([
      this.prisma.marketplaceDispute.findMany({
        where,
        include: this.listInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
      }),
      this.prisma.marketplaceDispute.count({ where }),
    ]);

    return {
      data: rows.map((row) => mapDispute(row)),
      meta: {
        page: parsed.page,
        limit: parsed.limit,
        total,
      },
    };
  }

  async getAdminDetail(disputeId: string): Promise<MarketplaceDispute> {
    const dispute = await this.access.getDisputeOrThrow(disputeId);
    return this.mapWithUrls(dispute);
  }

  async requestEvidence(adminId: string, disputeId: string, input: unknown) {
    const parsed = adminRequestEvidenceSchema.parse(input ?? {});
    const dispute = await this.access.getDisputeOrThrow(disputeId);

    if (['resolved_buyer_favored', 'resolved_seller_favored', 'closed'].includes(dispute.disputeStatus)) {
      throw new BadRequestException('Cannot request evidence on a resolved dispute');
    }

    const notes =
      parsed.notes?.trim() ||
      'Please upload additional evidence to help us review your dispute.';

    await this.prisma.$transaction(async (tx) => {
      await tx.marketplaceDispute.update({
        where: { id: disputeId },
        data: { disputeStatus: 'awaiting_evidence' },
      });

      await tx.disputeMessage.create({
        data: {
          disputeId,
          senderId: adminId,
          messageText: notes,
        },
      });
    });

    const listingTitle = dispute.listing?.title ?? 'your transaction';
    await Promise.all([
      this.notifications.dispatch({
        userId: dispute.buyerId,
        type: 'admin_warning',
        templateKey: 'dispute_evidence_requested',
        variables: { listing_title: listingTitle },
        actionUrl: `/account/disputes/${disputeId}`,
        data: { disputeId },
      }),
      this.notifications.dispatch({
        userId: dispute.sellerId,
        type: 'admin_warning',
        templateKey: 'dispute_evidence_requested',
        variables: { listing_title: listingTitle },
        actionUrl: `/account/disputes/${disputeId}`,
        data: { disputeId },
      }),
    ]);

    return this.getAdminDetail(disputeId);
  }

  async markUnderReview(disputeId: string): Promise<MarketplaceDispute> {
    const dispute = await this.access.getDisputeOrThrow(disputeId);

    if (['resolved_buyer_favored', 'resolved_seller_favored', 'closed'].includes(dispute.disputeStatus)) {
      throw new BadRequestException('Cannot update a resolved dispute');
    }

    await this.prisma.marketplaceDispute.update({
      where: { id: disputeId },
      data: { disputeStatus: 'under_review' },
    });

    return this.getAdminDetail(disputeId);
  }

  async resolve(adminId: string, disputeId: string, input: unknown): Promise<MarketplaceDispute> {
    const parsed = adminResolveDisputeSchema.parse(input);
    const dispute = await this.access.getDisputeOrThrow(disputeId);

    if (['resolved_buyer_favored', 'resolved_seller_favored', 'closed'].includes(dispute.disputeStatus)) {
      throw new BadRequestException('Dispute is already resolved');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.marketplaceDispute.update({
        where: { id: disputeId },
        data: {
          disputeStatus: parsed.outcome as MarketplaceDisputeStatus,
          resolutionNotes: parsed.resolutionNotes,
          resolvedById: adminId,
          resolvedAt: now,
        },
      });

      await tx.disputeMessage.create({
        data: {
          disputeId,
          senderId: adminId,
          messageText: `Resolution: ${parsed.resolutionNotes}`,
        },
      });
    });

    const listingTitle = dispute.listing?.title ?? 'your transaction';
    const outcomeLabel =
      parsed.outcome === 'resolved_buyer_favored'
        ? 'resolved in favor of the buyer'
        : parsed.outcome === 'resolved_seller_favored'
          ? 'resolved in favor of the seller'
          : 'closed';

    await Promise.all([
      this.notifications.dispatch({
        userId: dispute.buyerId,
        type: 'admin_warning',
        templateKey: 'dispute_resolved',
        variables: { listing_title: listingTitle, outcome: outcomeLabel },
        actionUrl: `/account/disputes/${disputeId}`,
        data: { disputeId, outcome: parsed.outcome },
      }),
      this.notifications.dispatch({
        userId: dispute.sellerId,
        type: 'admin_warning',
        templateKey: 'dispute_resolved',
        variables: { listing_title: listingTitle, outcome: outcomeLabel },
        actionUrl: `/account/disputes/${disputeId}`,
        data: { disputeId, outcome: parsed.outcome },
      }),
    ]);

    return this.getAdminDetail(disputeId);
  }

  private listInclude() {
    return {
      buyer: { select: { id: true, displayName: true } },
      seller: { select: { id: true, displayName: true } },
      listing: true,
    } as const;
  }

  private detailInclude() {
    return {
      buyer: { select: { id: true, displayName: true } },
      seller: { select: { id: true, displayName: true } },
      listing: true,
      evidence: { orderBy: { createdAt: 'asc' as const } },
      messages: {
        orderBy: { createdAt: 'asc' as const },
        include: { sender: { select: { id: true, displayName: true } } },
      },
    } as const;
  }

  private mapWithUrls(dispute: Awaited<ReturnType<DisputeAccessService['getDisputeOrThrow']>>) {
    const evidenceUrls = new Map<string, string>();
    for (const item of dispute.evidence ?? []) {
      evidenceUrls.set(item.filePath, resolveAssetPublicUrl(item.filePath));
    }
    return mapDispute(dispute, evidenceUrls);
  }
}
