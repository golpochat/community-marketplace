import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, SellerStatus, VerificationStatus } from '@prisma/client';

import {
  SELLER_VERIFICATION_MESSAGES,
  type SellerStatusHistoryEntry,
  type SellerVerificationRequest,
  type SellerVerificationStatus,
  type AdminSellerVerificationRow,
  type AdminSellerVerificationDetail,
} from '@community-marketplace/types';
import {
  sellerLimitSchema,
  sellerReverificationSchema,
  sellerSuspendSchema,
  sellerVerificationReviewSchema,
  sellerVerificationStartSchema,
  sellerVerificationFlowSubmitSchema,
  sellerVerificationUploadSchema,
  adminSellerVerificationListSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { OtpService } from '../../auth/services/otp.service';
import { R2StorageService } from '../../users/services/r2-storage.service';
import { UserAuditService } from '../../users/services/user-audit.service';
import {
  SellerListingGateService,
  SellerVerificationStatusService,
} from './seller-listing-gate.service';

@Injectable()
export class SellerVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly storage: R2StorageService,
    private readonly audit: UserAuditService,
    private readonly eventBus: EventBusService,
    private readonly listingGate: SellerListingGateService,
    private readonly statusService: SellerVerificationStatusService,
  ) {}

  getStatus(userId: string): Promise<SellerVerificationStatus> {
    return this.statusService.getStatus(userId);
  }

  async start(userId: string, input: unknown) {
    const parsed = sellerVerificationStartSchema.parse(input);

    if (parsed.action === 'check') {
      return this.statusService.getStatus(userId);
    }

    if (parsed.action === 'send_otp') {
      await this.otpService.sendOtp({
        channel: 'phone',
        phone: parsed.phone,
        purpose: 'seller_verify',
      });
      return {
        message: 'OTP sent to your phone',
        nextStage: 'phone' as const,
      };
    }

    await this.otpService.verifyOtp({
      channel: 'phone',
      phone: parsed.phone,
      purpose: 'seller_verify',
      code: parsed.code,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        profile: {
          upsert: {
            create: { phone: parsed.phone },
            update: { phone: parsed.phone },
          },
        },
      },
    });

    return this.statusService.getStatus(userId);
  }

  createIdUploadUrl(userId: string, input: unknown) {
    const parsed = sellerVerificationUploadSchema.parse(input);
    return this.storage.createVerificationDocumentUploadUrl(
      userId,
      parsed.contentType,
      parsed.fileName,
    );
  }

  createSelfieUploadUrl(userId: string, input: unknown) {
    const parsed = sellerVerificationUploadSchema.parse(input);
    return this.storage.createVerificationDocumentUploadUrl(
      userId,
      parsed.contentType,
      parsed.fileName,
    );
  }

  async submit(userId: string, input: unknown): Promise<SellerVerificationRequest> {
    const parsed = sellerVerificationFlowSubmitSchema.parse(input);
    const status = await this.statusService.getStatus(userId);

    if (!status.phoneVerified) {
      throw new BadRequestException('Phone verification is required before submitting documents');
    }
    if (!status.emailVerified) {
      throw new BadRequestException('Email verification is required before submitting documents');
    }
    if (status.pendingRequest) {
      throw new BadRequestException('A verification request is already pending review');
    }
    if (status.sellerStatus === 'verified') {
      throw new BadRequestException('You are already a verified seller');
    }

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sellerVerificationRequest.create({
        data: {
          userId,
          phoneNumber: parsed.phoneNumber ?? profile?.phone ?? undefined,
          idDocumentPath: parsed.idDocumentPath,
          selfiePath: parsed.selfiePath,
          addressDocumentPath: parsed.addressDocumentPath,
          status: 'pending',
        },
      });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { sellerStatus: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          verificationRequestedAt: new Date(),
          sellerStatus: 'under_review',
        },
      });

      await tx.sellerStatusHistory.create({
        data: {
          userId,
          oldStatus: user.sellerStatus,
          newStatus: 'under_review',
          changedBy: userId,
          reason: 'Verification documents submitted',
        },
      });

      return created;
    });

    await this.audit.record('verification_submitted', userId, userId, {
      verificationId: request.id,
    });

    this.eventBus.publish({
      type: 'user.verification_requested',
      payload: { userId, verificationId: request.id },
      timestamp: new Date(),
    });

    return this.statusService.mapRequest(request);
  }

  async listPending(page = 1, limit = 20) {
    return this.listAdmin({ page, limit, view: 'pending' });
  }

  async listAdmin(input: unknown) {
    const query = adminSellerVerificationListSchema.parse(input);
    const { page, limit, view, search, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const dateFilter =
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {}),
            },
          }
        : {};

    const searchFilter = search?.trim()
      ? {
          OR: [
            { email: { contains: search.trim(), mode: 'insensitive' as const } },
            { displayName: { contains: search.trim(), mode: 'insensitive' as const } },
          ],
        }
      : {};

    if (view === 'suspended' || view === 'under_review') {
      const sellerStatus: SellerStatus =
        view === 'suspended' ? 'suspended' : 'under_review';
      const where: Prisma.UserWhereInput = {
        primaryRole: { code: 'SELLER' },
        sellerStatus,
        ...searchFilter,
        ...(fromDate || toDate
          ? {
              verificationRequestedAt: {
                ...(fromDate ? { gte: new Date(fromDate) } : {}),
                ...(toDate ? { lte: new Date(toDate) } : {}),
              },
            }
          : {}),
      };

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy: { verificationRequestedAt: 'desc' },
          skip,
          take: limit,
          include: {
            profile: true,
            sellerVerificationRequests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: { select: { listings: true } },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users.map((user) =>
          this.mapAdminRowFromUser(user, user.sellerVerificationRequests[0]),
        ),
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    const requestStatus: VerificationStatus =
      view === 'approved'
        ? 'approved'
        : view === 'rejected'
          ? 'rejected'
          : 'pending';

    const where: Prisma.SellerVerificationRequestWhereInput = {
      status: requestStatus,
      user: {
        primaryRole: { code: 'SELLER' },
        ...searchFilter,
      },
      ...dateFilter,
    };

    const [rows, total] = await Promise.all([
      this.prisma.sellerVerificationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            include: {
              profile: true,
              _count: { select: { listings: true } },
            },
          },
        },
      }),
      this.prisma.sellerVerificationRequest.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapAdminRowFromRequest(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRequestDetail(requestId: string): Promise<AdminSellerVerificationDetail> {
    const request = await this.prisma.sellerVerificationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            profile: true,
            _count: { select: { listings: true } },
            sellerVerificationRequests: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        reviewedBy: { select: { id: true, displayName: true, email: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    const base = this.mapAdminRowFromRequest(request);
    const previousAttempts = request.user.sellerVerificationRequests
      .filter((row) => row.id !== request.id)
      .map((row) => this.statusService.mapRequest(row));

    return {
      ...base,
      previousAttempts,
      changedByName: request.reviewedBy?.displayName ?? request.reviewedBy?.email,
    };
  }

  async getSellerDetail(userId: string): Promise<AdminSellerVerificationDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        primaryRole: true,
        profile: true,
        _count: { select: { listings: true } },
        sellerVerificationRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user || user.primaryRole.code !== 'SELLER') {
      throw new NotFoundException('Seller not found');
    }

    const latest = user.sellerVerificationRequests[0];
    const base = this.mapAdminRowFromUser(user, latest);

    return {
      ...base,
      previousAttempts: user.sellerVerificationRequests
        .slice(1)
        .map((row) => this.statusService.mapRequest(row)),
    };
  }

  private mapAdminRowFromRequest(
    row: Prisma.SellerVerificationRequestGetPayload<{
      include: {
        user: {
          include: {
            profile: true;
            _count: { select: { listings: true } };
          };
        };
      };
    }>,
  ): AdminSellerVerificationRow {
    return {
      requestId: row.id,
      userId: row.userId,
      sellerName: row.user.displayName ?? undefined,
      email: row.user.email,
      phone: row.phoneNumber ?? row.user.profile?.phone ?? undefined,
      submittedAt: row.createdAt.toISOString(),
      requestStatus: row.status as AdminSellerVerificationRow['requestStatus'],
      sellerStatus: row.user.sellerStatus as AdminSellerVerificationRow['sellerStatus'],
      verificationRequestedAt: row.user.verificationRequestedAt?.toISOString(),
      verificationCompletedAt: row.user.verificationCompletedAt?.toISOString(),
      rejectionReason: row.rejectionReason ?? row.user.verificationRejectedReason ?? undefined,
      unverifiedListingCount: row.user.unverifiedListingCount,
      sellerLimit: row.user.sellerLimit,
      totalListings: row.user._count.listings,
      joinedAt: row.user.createdAt.toISOString(),
      idDocumentPath: row.idDocumentPath ?? undefined,
      selfiePath: row.selfiePath ?? undefined,
      addressDocumentPath: row.addressDocumentPath ?? undefined,
    };
  }

  private mapAdminRowFromUser(
    user: Prisma.UserGetPayload<{
      include: {
        profile: true;
        _count: { select: { listings: true } };
      };
    }>,
    request?: {
      id: string;
      phoneNumber: string | null;
      idDocumentPath: string | null;
      selfiePath: string | null;
      addressDocumentPath: string | null;
      status: VerificationStatus;
      rejectionReason: string | null;
      createdAt: Date;
    } | null,
  ): AdminSellerVerificationRow {
    return {
      requestId: request?.id,
      userId: user.id,
      sellerName: user.displayName ?? undefined,
      email: user.email,
      phone: request?.phoneNumber ?? user.profile?.phone ?? undefined,
      submittedAt: request?.createdAt.toISOString(),
      requestStatus: request?.status as AdminSellerVerificationRow['requestStatus'],
      sellerStatus: user.sellerStatus as AdminSellerVerificationRow['sellerStatus'],
      verificationRequestedAt: user.verificationRequestedAt?.toISOString(),
      verificationCompletedAt: user.verificationCompletedAt?.toISOString(),
      rejectionReason: request?.rejectionReason ?? user.verificationRejectedReason ?? undefined,
      unverifiedListingCount: user.unverifiedListingCount,
      sellerLimit: user.sellerLimit,
      totalListings: user._count.listings,
      joinedAt: user.createdAt.toISOString(),
      idDocumentPath: request?.idDocumentPath ?? undefined,
      selfiePath: request?.selfiePath ?? undefined,
      addressDocumentPath: request?.addressDocumentPath ?? undefined,
    };
  }

  async approve(reviewerId: string, input: unknown) {
    const parsed = sellerVerificationReviewSchema.parse(input);
    const request = await this.findRequestOrThrow(parsed.requestId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: request.userId },
      select: { sellerStatus: true },
    });

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.sellerVerificationRequest.update({
        where: { id: parsed.requestId },
        data: {
          status: 'approved',
          reviewedById: reviewerId,
          reviewedAt: now,
        },
      }),
      this.prisma.user.update({
        where: { id: request.userId },
        data: {
          sellerStatus: 'verified',
          idVerified: true,
          verificationCompletedAt: now,
          verificationRejectedReason: null,
        },
      }),
      this.prisma.sellerStatusHistory.create({
        data: {
          userId: request.userId,
          oldStatus: user.sellerStatus,
          newStatus: 'verified',
          changedBy: reviewerId,
          reason: 'Verification approved',
        },
      }),
    ]);

    await this.audit.record('verification_approved', reviewerId, request.userId, {
      verificationId: parsed.requestId,
    });

    this.eventBus.publish({
      type: 'user.verification_approved',
      payload: { userId: request.userId, verificationId: parsed.requestId },
      timestamp: now,
    });

    return {
      request: this.statusService.mapRequest(updated),
      message: SELLER_VERIFICATION_MESSAGES.APPROVED,
    };
  }

  async reject(reviewerId: string, input: unknown) {
    const parsed = sellerVerificationReviewSchema.parse(input);
    if (!parsed.reason?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    const request = await this.findRequestOrThrow(parsed.requestId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: request.userId },
      select: { sellerStatus: true },
    });

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.sellerVerificationRequest.update({
        where: { id: parsed.requestId },
        data: {
          status: 'rejected',
          reviewedById: reviewerId,
          reviewedAt: now,
          rejectionReason: parsed.reason,
        },
      }),
      this.prisma.user.update({
        where: { id: request.userId },
        data: {
          sellerStatus: 'unverified',
          idVerified: false,
          verificationRejectedReason: parsed.reason,
        },
      }),
      this.prisma.sellerStatusHistory.create({
        data: {
          userId: request.userId,
          oldStatus: user.sellerStatus,
          newStatus: 'unverified',
          changedBy: reviewerId,
          reason: parsed.reason,
        },
      }),
    ]);

    await this.audit.record('verification_rejected', reviewerId, request.userId, {
      verificationId: parsed.requestId,
      reason: parsed.reason,
    });

    this.eventBus.publish({
      type: 'user.verification_rejected',
      payload: {
        userId: request.userId,
        verificationId: parsed.requestId,
        reason: parsed.reason,
      },
      timestamp: now,
    });

    return {
      request: this.statusService.mapRequest(updated),
      message: `${SELLER_VERIFICATION_MESSAGES.REJECTED_PREFIX} ${parsed.reason}`,
    };
  }

  async suspendSeller(actorId: string, input: unknown) {
    const parsed = sellerSuspendSchema.parse(input);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: parsed.userId },
      select: { sellerStatus: true },
    });

    const durationLabel =
      parsed.duration === '7_days'
        ? '7 days'
        : parsed.duration === '30_days'
          ? '30 days'
          : parsed.duration === 'permanent'
            ? 'permanent'
            : undefined;

    const reason = [durationLabel ? `Duration: ${durationLabel}` : null, parsed.reason]
      .filter(Boolean)
      .join(' — ');

    await this.listingGate.transitionStatus(
      parsed.userId,
      user.sellerStatus,
      'suspended',
      actorId,
      reason || 'Seller suspended',
    );

    if (reason) {
      await this.prisma.user.update({
        where: { id: parsed.userId },
        data: { verificationRejectedReason: reason },
      });
    }

    await this.audit.record('user_suspended', actorId, parsed.userId, {
      reason: parsed.reason,
      scope: 'seller',
    });

    return { userId: parsed.userId, sellerStatus: 'suspended' as const };
  }

  async setSellerLimit(actorId: string, input: unknown) {
    const parsed = sellerLimitSchema.parse(input);
    const before = await this.prisma.user.findUniqueOrThrow({
      where: { id: parsed.userId },
      select: {
        sellerLimit: true,
        unverifiedListingCount: true,
        sellerStatus: true,
      },
    });

    const user = await this.prisma.user.update({
      where: { id: parsed.userId },
      data: { sellerLimit: parsed.sellerLimit },
      select: { id: true, sellerLimit: true, unverifiedListingCount: true, sellerStatus: true },
    });

    await this.prisma.sellerStatusHistory.create({
      data: {
        userId: parsed.userId,
        oldStatus: before.sellerStatus,
        newStatus: before.sellerStatus,
        changedBy: actorId,
        reason:
          parsed.reason ??
          `Listing limit changed from ${before.sellerLimit} to ${parsed.sellerLimit}`,
      },
    });

    if (
      user.sellerStatus === 'unverified' &&
      user.unverifiedListingCount >= user.sellerLimit
    ) {
      await this.listingGate.transitionStatus(
        parsed.userId,
        user.sellerStatus,
        'verification_required',
        actorId,
        'Seller listing limit reduced',
      );
    }

    await this.audit.record('profile_update', actorId, parsed.userId, {
      sellerLimit: parsed.sellerLimit,
    });

    return user;
  }

  async requestReverification(actorId: string, input: unknown) {
    const parsed = sellerReverificationSchema.parse(input);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: parsed.userId },
      select: { sellerStatus: true },
    });

    await this.prisma.user.update({
      where: { id: parsed.userId },
      data: {
        idVerified: false,
        verificationCompletedAt: null,
      },
    });

    await this.listingGate.transitionStatus(
      parsed.userId,
      user.sellerStatus,
      'verification_required',
      actorId,
      parsed.reason ?? 'Re-verification requested',
    );

    return { userId: parsed.userId, sellerStatus: 'verification_required' as const };
  }

  async getStatusHistory(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.sellerStatusHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellerStatusHistory.count({ where: { userId } }),
    ]);

    const data: SellerStatusHistoryEntry[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      oldStatus: row.oldStatus,
      newStatus: row.newStatus,
      changedBy: row.changedBy ?? undefined,
      reason: row.reason ?? undefined,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async findRequestOrThrow(requestId: string) {
    const request = await this.prisma.sellerVerificationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('Pending verification request not found');
    }
    return request;
  }
}
