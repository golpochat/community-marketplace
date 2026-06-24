import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { UserVerification } from "@community-marketplace/types";
import {
  sellerVerificationSubmitSchema,
  verificationReviewSchema,
} from "@community-marketplace/validation";

import { PrismaService } from "../../../database/prisma.service";
import { EventBusService } from "../../../events/event-bus.service";
import { mapVerification } from "../mappers/user.mapper";
import { UserAuditService } from "./user-audit.service";

@Injectable()
export class UsersVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: UserAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async submitSellerVerification(
    userId: string,
    input: unknown,
  ): Promise<UserVerification> {
    const parsed = sellerVerificationSubmitSchema.parse(input);

    const pending = await this.prisma.userVerification.findFirst({
      where: { userId, status: "pending" },
    });
    if (pending) {
      throw new BadRequestException(
        "A verification request is already pending review",
      );
    }

    const verification = await this.prisma.userVerification.create({
      data: {
        userId,
        status: "pending",
        idDocumentFrontUrl: parsed.idDocumentFrontUrl,
        idDocumentBackUrl: parsed.idDocumentBackUrl,
        selfieUrl: parsed.selfieUrl,
        addressProofUrl: parsed.addressProofUrl,
      },
    });

    await this.audit.record("verification_submitted", userId, userId, {
      verificationId: verification.id,
    });

    this.eventBus.publish({
      type: "user.verification_requested",
      payload: { userId, verificationId: verification.id },
      timestamp: new Date(),
    });

    return mapVerification(verification);
  }

  async getLatestForUser(userId: string): Promise<UserVerification | null> {
    const verification = await this.prisma.userVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return verification ? mapVerification(verification) : null;
  }

  async listPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.userVerification.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: {
          user: { include: { primaryRole: true, profile: true } },
        },
      }),
      this.prisma.userVerification.count({ where: { status: "pending" } }),
    ]);

    return {
      data: rows.map((row) => ({
        ...mapVerification(row),
        user: {
          id: row.user.id,
          email: row.user.email,
          displayName: row.user.displayName,
          role: row.user.primaryRole.code,
        },
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approve(verificationId: string, reviewerId: string, input?: unknown) {
    verificationReviewSchema.parse(input ?? {});
    const verification = await this.findOrThrow(verificationId);

    const updated = await this.prisma.userVerification.update({
      where: { id: verificationId },
      data: {
        status: "approved",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        badgeGranted: true,
      },
    });

    await this.audit.record(
      "verification_approved",
      reviewerId,
      verification.userId,
      {
        verificationId,
      },
    );

    this.eventBus.publish({
      type: "user.verification_approved",
      payload: { userId: verification.userId, verificationId },
      timestamp: new Date(),
    });

    return mapVerification(updated);
  }

  async reject(verificationId: string, reviewerId: string, input?: unknown) {
    const parsed = verificationReviewSchema.parse(input ?? {});
    const verification = await this.findOrThrow(verificationId);

    const updated = await this.prisma.userVerification.update({
      where: { id: verificationId },
      data: {
        status: "rejected",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: parsed.reason,
        badgeGranted: false,
      },
    });

    await this.audit.record(
      "verification_rejected",
      reviewerId,
      verification.userId,
      {
        verificationId,
        reason: parsed.reason,
      },
    );

    this.eventBus.publish({
      type: "user.verification_rejected",
      payload: {
        userId: verification.userId,
        verificationId,
        reason: parsed.reason,
      },
      timestamp: new Date(),
    });

    return mapVerification(updated);
  }

  hasVerificationBadge(userId: string) {
    return this.prisma.userVerification.findFirst({
      where: { userId, badgeGranted: true, status: "approved" },
    });
  }

  private async findOrThrow(verificationId: string) {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id: verificationId },
    });
    if (!verification)
      throw new NotFoundException("Verification request not found");
    return verification;
  }
}
