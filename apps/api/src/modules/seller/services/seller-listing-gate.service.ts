import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SellerStatus } from '@prisma/client';

import {
  SELLER_VERIFICATION_MESSAGES,
  type SellerListingGateResult,
  type SellerVerificationStatus,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { SellerStatusHistoryService } from './seller-status-history.service';

@Injectable()
export class SellerListingGateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statusHistory: SellerStatusHistoryService,
  ) {}

  async assertCanCreateListing(sellerId: string): Promise<void> {
    const result = await this.checkCanCreateListing(sellerId);
    if (!result.allowed) {
      throw new ForbiddenException({
        message: result.blockMessage,
        code: result.blockCode,
      });
    }
  }

  async assertCanSubmitForReview(sellerId: string): Promise<void> {
    const result = await this.checkCanPublishListing(sellerId);
    if (!result.allowed) {
      throw new ForbiddenException({
        message: result.blockMessage,
        code: result.blockCode,
      });
    }
  }

  async assertCanActivateListing(
    sellerId: string,
    isFirstActivation: boolean,
  ): Promise<void> {
    if (!isFirstActivation) return;
    const result = await this.checkCanPublishListing(sellerId);
    if (!result.allowed) {
      throw new ForbiddenException({
        message: result.blockMessage,
        code: result.blockCode,
      });
    }
  }

  /** Blocks all seller listing mutations when the account is suspended. */
  async assertSellerNotSuspended(sellerId: string): Promise<void> {
    const seller = await this.getSellerFields(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    if (seller.sellerStatus === 'suspended') {
      throw new ForbiddenException({
        message:
          seller.verificationRejectedReason ?? 'Your seller account is suspended.',
        code: 'SELLER_SUSPENDED',
      });
    }
  }

  /** Draft create / duplicate — account status only; no slot consumption. */
  async checkCanCreateListing(sellerId: string): Promise<SellerListingGateResult> {
    const seller = await this.getSellerFields(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    switch (seller.sellerStatus) {
      case 'verified':
      case 'unverified':
        return { allowed: true };

      case 'verification_required':
        return {
          allowed: false,
          blockMessage: SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED,
          blockCode: 'VERIFICATION_REQUIRED',
        };

      case 'under_review':
        return {
          allowed: false,
          blockMessage: SELLER_VERIFICATION_MESSAGES.UNDER_REVIEW,
          blockCode: 'UNDER_REVIEW',
        };

      case 'suspended':
        return {
          allowed: false,
          blockMessage: seller.verificationRejectedReason ?? 'Your seller account is suspended.',
          blockCode: 'SELLER_SUSPENDED',
        };

      default:
        return { allowed: true };
    }
  }

  /** Submit for review or first-time publish — counts approved live slots. */
  async checkCanPublishListing(sellerId: string): Promise<SellerListingGateResult> {
    const seller = await this.getSellerFields(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (seller.sellerStatus === 'verified') {
      return { allowed: true };
    }

    if (seller.sellerStatus === 'suspended') {
      return {
        allowed: false,
        blockMessage: seller.verificationRejectedReason ?? 'Your seller account is suspended.',
        blockCode: 'SELLER_SUSPENDED',
      };
    }

    if (seller.sellerStatus === 'under_review') {
      return {
        allowed: false,
        blockMessage: SELLER_VERIFICATION_MESSAGES.UNDER_REVIEW,
        blockCode: 'UNDER_REVIEW',
      };
    }

    if (seller.approvedListingCount >= seller.sellerLimit) {
      if (seller.sellerStatus === 'unverified') {
        await this.transitionStatus(
          sellerId,
          seller.sellerStatus,
          'verification_required',
          null,
          SELLER_VERIFICATION_MESSAGES.MAX_UNVERIFIED,
        );
      }
      return {
        allowed: false,
        blockMessage: SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED,
        blockCode: 'VERIFICATION_REQUIRED',
      };
    }

    return { allowed: true };
  }

  async onListingActivated(sellerId: string): Promise<{ nudgeMessage?: string }> {
    const seller = await this.getSellerFields(sellerId);
    if (!seller || seller.sellerStatus === 'verified') {
      return {};
    }

    const newCount = seller.approvedListingCount + 1;

    if (newCount >= seller.sellerLimit) {
      await this.prisma.user.update({
        where: { id: sellerId },
        data: { approvedListingCount: newCount },
      });
      await this.transitionStatus(
        sellerId,
        seller.sellerStatus,
        'verification_required',
        null,
        SELLER_VERIFICATION_MESSAGES.MAX_UNVERIFIED,
      );
    } else {
      await this.prisma.user.update({
        where: { id: sellerId },
        data: { approvedListingCount: newCount },
      });
    }

    return { nudgeMessage: this.getNudgeMessage(newCount, seller.sellerLimit) };
  }

  /** @deprecated Listing slots are counted on activation, not create. */
  async onListingCreated(_sellerId: string): Promise<{ nudgeMessage?: string }> {
    return {};
  }

  getNudgeMessage(count: number, limit: number): string | undefined {
    if (count === 1) return SELLER_VERIFICATION_MESSAGES.NUDGE_FIRST_LISTING;
    if (count === 3) return SELLER_VERIFICATION_MESSAGES.NUDGE_THIRD_LISTING;
    if (count === limit - 1) return SELLER_VERIFICATION_MESSAGES.NUDGE_ONE_LEFT;
    if (count === limit) return SELLER_VERIFICATION_MESSAGES.NUDGE_LIMIT_REACHED;
    return undefined;
  }

  getApprovedCountForStatus(user: {
    approvedListingCount: number;
    unverifiedListingCount: number;
  }): number {
    return user.approvedListingCount ?? user.unverifiedListingCount ?? 0;
  }

  async transitionStatus(
    userId: string,
    oldStatus: SellerStatus,
    newStatus: SellerStatus,
    changedBy: string | null,
    reason?: string,
  ) {
    if (oldStatus === newStatus) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { sellerStatus: newStatus },
      });
      await this.statusHistory.logChange(
        {
          userId,
          oldStatus,
          newStatus,
          changedBy,
          reason,
        },
        tx,
      );
    });
  }

  private getSellerFields(sellerId: string) {
    return this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        sellerStatus: true,
        approvedListingCount: true,
        unverifiedListingCount: true,
        sellerLimit: true,
        verificationRejectedReason: true,
      },
    });
  }
}

@Injectable()
export class SellerVerificationStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listingGate: SellerListingGateService,
  ) {}

  async getStatus(userId: string): Promise<SellerVerificationStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sellerVerificationRequests: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const phoneVerified = user.phoneVerified || Boolean(user.phoneVerifiedAt);
    const emailVerified = user.emailVerified || Boolean(user.emailVerifiedAt);
    const pendingRequest = user.sellerVerificationRequests[0] ?? null;
    const verificationSubmitted = Boolean(user.verificationRequestedAt);
    const approvedListingCount = this.listingGate.getApprovedCountForStatus(user);

    const currentStage = this.resolveStage({
      phoneVerified,
      emailVerified,
      sellerStatus: user.sellerStatus,
      verificationSubmitted,
      idVerified: user.idVerified,
    });

    const nudgeMessage =
      user.sellerStatus === 'unverified'
        ? this.listingGate.getNudgeMessage(approvedListingCount, user.sellerLimit)
        : undefined;

    return {
      sellerStatus: user.sellerStatus,
      approvedListingCount,
      unverifiedListingCount: approvedListingCount,
      sellerLimit: user.sellerLimit,
      phoneVerified,
      emailVerified,
      idVerified: user.idVerified,
      currentStage,
      nudgeMessage,
      verificationRequestedAt: user.verificationRequestedAt?.toISOString(),
      verificationCompletedAt: user.verificationCompletedAt?.toISOString(),
      verificationRejectedReason: user.verificationRejectedReason ?? undefined,
      pendingRequest: pendingRequest ? this.mapRequest(pendingRequest) : null,
    };
  }

  private resolveStage(input: {
    phoneVerified: boolean;
    emailVerified: boolean;
    sellerStatus: SellerStatus;
    verificationSubmitted: boolean;
    idVerified: boolean;
  }) {
    if (input.sellerStatus === 'verified' || input.idVerified) return 'complete' as const;
    if (input.verificationSubmitted) return 'review' as const;
    if (!input.phoneVerified) return 'phone' as const;
    if (!input.emailVerified) return 'email' as const;
    return 'identity' as const;
  }

  mapRequest(row: {
    id: string;
    userId: string;
    phoneNumber: string | null;
    idDocumentPath: string | null;
    selfiePath: string | null;
    addressDocumentPath: string | null;
    status: string;
    priority?: boolean;
    reviewedById: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      phoneNumber: row.phoneNumber ?? undefined,
      idDocumentPath: row.idDocumentPath ?? undefined,
      selfiePath: row.selfiePath ?? undefined,
      addressDocumentPath: row.addressDocumentPath ?? undefined,
      status: row.status as 'pending' | 'approved' | 'rejected',
      priority: row.priority ?? undefined,
      reviewedById: row.reviewedById ?? undefined,
      reviewedAt: row.reviewedAt?.toISOString(),
      rejectionReason: row.rejectionReason ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
