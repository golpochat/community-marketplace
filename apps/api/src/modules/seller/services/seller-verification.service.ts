import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, SellerStatus, SellerVerificationRequest, VerificationStatus } from '@prisma/client';

import {
  SELLER_VERIFICATION_MESSAGES,
  type SellerVerificationNextStep,
  type SellerVerificationRequest as SellerVerificationRequestDto,
  type SellerVerificationStartResponse,
  type SellerVerificationStatus,
  type AdminSellerVerificationRow,
  type AdminSellerVerificationDetail,
} from '@community-marketplace/types';
import {
  sellerLimitSchema,
  sellerReactivateSchema,
  sellerForceReverifySchema,
  sellerSuspendSchema,
  sellerVerificationReviewSchema,
  sellerVerificationStartSchema,
  sellerVerificationPhoneSchema,
  sellerVerificationFlowSubmitSchema,
  sellerVerificationDocumentSchema,
  adminSellerVerificationListSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { OtpService } from '../../auth/services/otp.service';
import { R2StorageService } from '../../users/services/r2-storage.service';
import { UserAuditService } from '../../users/services/user-audit.service';
import { FastTrackFulfillmentService } from '../../monetization/services/fast-track-fulfillment.service';
import {
  SellerListingGateService,
  SellerVerificationStatusService,
} from './seller-listing-gate.service';
import { SellerStatusHistoryService } from './seller-status-history.service';

type DraftRequest = SellerVerificationRequest;

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
    private readonly statusHistory: SellerStatusHistoryService,
    private readonly fastTrackFulfillment: FastTrackFulfillmentService,
  ) {}

  getStatus(userId: string): Promise<SellerVerificationStatus> {
    return this.statusService.getStatus(userId);
  }

  async start(userId: string, input: unknown = {}) {
    const parsed = sellerVerificationStartSchema.parse(input);

    if (typeof parsed === 'object' && parsed !== null && 'action' in parsed) {
      if (parsed.action === 'check') {
        return this.statusService.getStatus(userId);
      }
      return this.verifyPhone(userId, parsed);
    }

    const status = await this.statusService.getStatus(userId);
    this.assertCanBeginVerification(status);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { sellerStatus: true, verificationRequestedAt: true },
    });

    if (user.verificationRequestedAt) {
      throw new BadRequestException('A verification request is already pending review');
    }

    const request = await this.getOrCreateDraftRequest(userId, user.sellerStatus);

    return this.buildStartResponse(request, status);
  }

  async verifyPhone(userId: string, input: unknown) {
    const parsed = sellerVerificationPhoneSchema.parse(input);

    if (parsed.action === 'send_otp') {
      await this.otpService.sendOtp({
        channel: 'phone',
        phone: parsed.phone,
        purpose: 'seller_verify',
      });
      return {
        message: 'OTP sent to your phone',
        nextRequiredStep: 'phone' as const,
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

    const draft = await this.getOrCreateDraftRequest(userId);
    await this.prisma.sellerVerificationRequest.update({
      where: { id: draft.id },
      data: { phoneNumber: parsed.phone },
    });

    const status = await this.statusService.getStatus(userId);
    return {
      ...this.buildStartResponse(draft, status),
      message: 'Phone verified successfully',
    };
  }

  uploadIdDocument(userId: string, input: unknown) {
    return this.handleDocumentUpload(userId, input, 'idDocumentPath');
  }

  uploadSelfie(userId: string, input: unknown) {
    return this.handleDocumentUpload(userId, input, 'selfiePath');
  }

  uploadAddressDocument(userId: string, input: unknown) {
    return this.handleDocumentUpload(userId, input, 'addressDocumentPath');
  }

  async submit(userId: string, input: unknown): Promise<SellerVerificationRequestDto> {
    const parsed = sellerVerificationFlowSubmitSchema.parse(input);
    const status = await this.statusService.getStatus(userId);

    if (!status.phoneVerified) {
      throw new BadRequestException('Phone verification is required before submitting documents');
    }
    if (!status.emailVerified) {
      throw new BadRequestException('Email verification is required before submitting documents');
    }
    if (status.sellerStatus === 'verified') {
      throw new BadRequestException('You are already a verified seller');
    }
    if (status.verificationRequestedAt) {
      throw new BadRequestException('A verification request is already pending review');
    }

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const draft = await this.getOrCreateDraftRequest(userId);

    const idDocumentPath = parsed.idDocumentPath ?? draft.idDocumentPath ?? undefined;
    const selfiePath = parsed.selfiePath ?? draft.selfiePath ?? undefined;
    const addressDocumentPath =
      parsed.addressDocumentPath ?? draft.addressDocumentPath ?? undefined;

    if (!idDocumentPath || !selfiePath) {
      throw new BadRequestException('ID document and selfie are required before submission');
    }

    const now = new Date();
    const request = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.sellerVerificationRequest.update({
        where: { id: draft.id },
        data: {
          phoneNumber: parsed.phoneNumber ?? profile?.phone ?? draft.phoneNumber ?? undefined,
          idDocumentPath,
          selfiePath,
          addressDocumentPath,
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
          verificationRequestedAt: now,
          sellerStatus: 'under_review',
        },
      });

      if (user.sellerStatus !== 'under_review') {
        await this.statusHistory.logChange(
          {
            userId,
            oldStatus: user.sellerStatus,
            newStatus: 'under_review',
            changedBy: userId,
            reason: 'Verification documents submitted',
          },
          tx,
        );
      }

      return updated;
    });

    await this.fastTrackFulfillment.applyPendingFastTrackOnSubmit(userId, request.id);

    await this.audit.record('verification_submitted', userId, userId, {
      verificationId: request.id,
    });

    this.eventBus.publish({
      type: 'user.verification_requested',
      payload: { userId, verificationId: request.id },
      timestamp: now,
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
        ...(view === 'pending'
          ? {
              verificationRequestedAt: { not: null },
              sellerStatus: { notIn: ['verified'] },
            }
          : {}),
      },
      ...dateFilter,
    };

    const [rows, total] = await Promise.all([
      this.prisma.sellerVerificationRequest.findMany({
        where,
        orderBy:
          view === 'pending'
            ? [{ priority: 'desc' }, { createdAt: 'asc' }]
            : { createdAt: 'desc' },
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

    const latest =
      user.sellerStatus === 'verified'
        ? (user.sellerVerificationRequests.find((r) => r.status === 'approved') ??
          user.sellerVerificationRequests[0])
        : (user.sellerVerificationRequests.find((r) => r.status === 'pending') ??
          user.sellerVerificationRequests[0]);
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
      priority: row.priority,
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
      priority?: boolean;
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
      priority: request?.priority,
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
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.sellerVerificationRequest.update({
        where: { id: parsed.requestId },
        data: {
          status: 'approved',
          reviewedById: reviewerId,
          reviewedAt: now,
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: {
          sellerStatus: 'verified',
          idVerified: true,
          verificationCompletedAt: now,
          verificationRejectedReason: null,
        },
      });

      await tx.sellerVerificationRequest.updateMany({
        where: {
          userId: request.userId,
          status: 'pending',
          id: { not: parsed.requestId },
        },
        data: {
          status: 'rejected',
          reviewedById: reviewerId,
          reviewedAt: now,
          rejectionReason: 'Superseded by approved verification',
        },
      });

      await this.statusHistory.logChange(
        {
          userId: request.userId,
          oldStatus: user.sellerStatus,
          newStatus: 'verified',
          changedBy: reviewerId,
          reason: parsed.reason ?? 'Verification approved',
        },
        tx,
      );

      return updatedRequest;
    });

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
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.sellerVerificationRequest.update({
        where: { id: parsed.requestId },
        data: {
          status: 'rejected',
          reviewedById: reviewerId,
          reviewedAt: now,
          rejectionReason: parsed.reason,
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: {
          sellerStatus: 'unverified',
          idVerified: false,
          verificationRequestedAt: null,
          verificationRejectedReason: parsed.reason,
        },
      });

      await this.statusHistory.logChange(
        {
          userId: request.userId,
          oldStatus: user.sellerStatus,
          newStatus: 'unverified',
          changedBy: reviewerId,
          reason: parsed.reason,
        },
        tx,
      );

      return updatedRequest;
    });

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

    if (user.sellerStatus === 'suspended') {
      throw new BadRequestException('Seller is already suspended');
    }

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
      reason,
    );

    await this.prisma.user.update({
      where: { id: parsed.userId },
      data: { verificationRejectedReason: reason },
    });

    await this.audit.record('user_suspended', actorId, parsed.userId, {
      reason: parsed.reason,
      duration: parsed.duration,
      scope: 'seller',
    });

    const now = new Date();
    this.eventBus.publish({
      type: 'seller.suspended',
      payload: {
        userId: parsed.userId,
        reason: parsed.reason,
        duration: parsed.duration,
        message: `${SELLER_VERIFICATION_MESSAGES.SUSPENDED} ${parsed.reason}`,
      },
      timestamp: now,
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

    await this.statusHistory.logChange({
      userId: parsed.userId,
      oldStatus: before.sellerStatus,
      newStatus: before.sellerStatus,
      changedBy: actorId,
      reason:
        parsed.reason ??
        `Listing limit changed from ${before.sellerLimit} to ${parsed.sellerLimit}`,
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

  async forceReverifySeller(actorId: string, input: unknown) {
    const parsed = sellerForceReverifySchema.parse(input);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: parsed.userId },
      include: { profile: { select: { phone: true } } },
    });

    if (user.sellerStatus === 'suspended') {
      throw new BadRequestException('Cannot force re-verification on a suspended seller');
    }

    const reason = parsed.reason;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: parsed.userId },
        data: {
          idVerified: false,
          verificationCompletedAt: null,
          verificationRequestedAt: null,
        },
      });

      await tx.sellerVerificationRequest.create({
        data: {
          userId: parsed.userId,
          phoneNumber: user.profile?.phone ?? undefined,
          status: 'pending',
        },
      });

      if (user.sellerStatus !== 'verification_required') {
        await tx.user.update({
          where: { id: parsed.userId },
          data: { sellerStatus: 'verification_required' },
        });
        await this.statusHistory.logChange(
          {
            userId: parsed.userId,
            oldStatus: user.sellerStatus,
            newStatus: 'verification_required',
            changedBy: actorId,
            reason,
          },
          tx,
        );
      } else {
        await this.statusHistory.logChange(
          {
            userId: parsed.userId,
            oldStatus: 'verification_required',
            newStatus: 'verification_required',
            changedBy: actorId,
            reason,
          },
          tx,
        );
      }
    });

    await this.audit.record('profile_update', actorId, parsed.userId, {
      action: 'seller_force_reverify',
      reason,
    });

    const now = new Date();
    this.eventBus.publish({
      type: 'seller.force_reverify',
      payload: {
        userId: parsed.userId,
        reason,
        message: SELLER_VERIFICATION_MESSAGES.FORCE_REVERIFY,
      },
      timestamp: now,
    });

    return { userId: parsed.userId, sellerStatus: 'verification_required' as const };
  }

  async requestReverification(actorId: string, input: unknown) {
    return this.forceReverifySeller(actorId, input);
  }

  async reactivateSeller(actorId: string, input: unknown) {
    const parsed = sellerReactivateSchema.parse(input);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: parsed.userId },
      select: { sellerStatus: true, idVerified: true },
    });

    if (user.sellerStatus !== 'suspended') {
      throw new BadRequestException('Only suspended sellers can be reactivated');
    }

    const newStatus = await this.resolvePreSuspensionStatus(parsed.userId, user.idVerified);

    await this.listingGate.transitionStatus(
      parsed.userId,
      user.sellerStatus,
      newStatus,
      actorId,
      parsed.reason,
    );

    await this.prisma.user.update({
      where: { id: parsed.userId },
      data: { verificationRejectedReason: null },
    });

    await this.audit.record('profile_update', actorId, parsed.userId, {
      action: 'seller_reactivated',
      reason: parsed.reason,
    });

    const now = new Date();
    this.eventBus.publish({
      type: 'seller.reactivated',
      payload: {
        userId: parsed.userId,
        reason: parsed.reason,
        sellerStatus: newStatus,
        message: SELLER_VERIFICATION_MESSAGES.REACTIVATED,
      },
      timestamp: now,
    });

    return { userId: parsed.userId, sellerStatus: newStatus };
  }

  private async resolvePreSuspensionStatus(
    userId: string,
    idVerified: boolean,
  ): Promise<SellerStatus> {
    const suspensionEntry = await this.prisma.sellerStatusHistory.findFirst({
      where: { userId, newStatus: 'suspended' },
      orderBy: { createdAt: 'desc' },
    });

    if (!suspensionEntry) {
      return idVerified ? 'verified' : 'unverified';
    }

    return suspensionEntry.oldStatus === 'verified' ? 'verified' : 'unverified';
  }

  private async handleDocumentUpload(
    userId: string,
    input: unknown,
    field: 'idDocumentPath' | 'selfiePath' | 'addressDocumentPath',
  ) {
    const parsed = sellerVerificationDocumentSchema.parse(input);

    if ('filePath' in parsed) {
      const draft = await this.getOrCreateDraftRequest(userId);
      const updated = await this.prisma.sellerVerificationRequest.update({
        where: { id: draft.id },
        data: { [field]: parsed.filePath },
      });

      return {
        stored: true,
        filePath: parsed.filePath,
        requestId: updated.id,
        nextRequiredStep: this.resolveNextStep(
          await this.statusService.getStatus(userId),
          updated,
        ),
      };
    }

    const upload = await this.storage.createVerificationDocumentUploadUrl(
      userId,
      parsed.contentType,
      parsed.fileName,
    );

    const stepByField = {
      idDocumentPath: 'id_document',
      selfiePath: 'selfie',
      addressDocumentPath: 'address',
    } as const;

    return {
      ...upload,
      nextRequiredStep: stepByField[field],
    };
  }

  private async getOrCreateDraftRequest(
    userId: string,
    currentSellerStatus?: SellerStatus,
  ): Promise<DraftRequest> {
    const user =
      currentSellerStatus !== undefined
        ? { sellerStatus: currentSellerStatus }
        : await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { sellerStatus: true },
          });

    if (user.sellerStatus === 'verified') {
      throw new BadRequestException('You are already a verified seller');
    }

    const existing = await this.findDraftRequest(userId);
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.sellerVerificationRequest.create({
        data: {
          userId,
          status: 'pending',
        },
      });

      if (user.sellerStatus !== 'under_review') {
        await tx.user.update({
          where: { id: userId },
          data: { sellerStatus: 'under_review' },
        });
        await this.statusHistory.logChange(
          {
            userId,
            oldStatus: user.sellerStatus,
            newStatus: 'under_review',
            changedBy: userId,
            reason: 'Seller verification started',
          },
          tx,
        );
      }

      return created;
    });
  }

  private findDraftRequest(userId: string): Promise<DraftRequest | null> {
    return this.prisma.sellerVerificationRequest.findFirst({
      where: {
        userId,
        status: 'pending',
        user: { verificationRequestedAt: null },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildStartResponse(
    request: DraftRequest,
    status: SellerVerificationStatus,
  ): SellerVerificationStartResponse {
    return {
      requestId: request.id,
      nextRequiredStep: this.resolveNextStep(status, request),
      sellerStatus: status.sellerStatus,
      phoneVerified: status.phoneVerified,
      emailVerified: status.emailVerified,
    };
  }

  private resolveNextStep(
    status: SellerVerificationStatus,
    request?: Pick<
      DraftRequest,
      'idDocumentPath' | 'selfiePath' | 'addressDocumentPath'
    > | null,
  ): SellerVerificationNextStep {
    if (status.sellerStatus === 'verified' || status.idVerified) return 'complete';
    if (status.verificationRequestedAt) return 'review';
    if (!status.phoneVerified) return 'phone';
    if (!status.emailVerified) return 'email';
    if (!request?.idDocumentPath) return 'id_document';
    if (!request?.selfiePath) return 'selfie';
    if (!request?.addressDocumentPath) return 'address';
    return 'submit';
  }

  private assertCanBeginVerification(status: SellerVerificationStatus) {
    if (status.sellerStatus === 'verified') {
      throw new BadRequestException('You are already a verified seller');
    }
    if (status.sellerStatus === 'suspended') {
      throw new ForbiddenException('Your seller account is suspended');
    }
    if (status.verificationRequestedAt) {
      throw new BadRequestException('A verification request is already pending review');
    }
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
