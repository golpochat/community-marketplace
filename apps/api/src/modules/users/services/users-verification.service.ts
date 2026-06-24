import { Injectable, BadRequestException } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { UserVerificationEntity } from '../entities/user-verification.entity';
import type { VerifyEmailDto, VerifyIdentityDto } from '../dto/users.dto';

@Injectable()
export class UsersVerificationService {
  private readonly verifications = new Map<string, UserVerificationEntity[]>();

  constructor(private readonly eventBus: EventBusService) {}

  requestIdentityVerification(userId: string, dto: VerifyIdentityDto): UserVerificationEntity {
    const verification = this.createVerification(userId, 'identity', dto.documentUrl);

    this.eventBus.publish({
      type: 'user.verification_requested',
      payload: { userId, type: 'identity' },
      timestamp: new Date(),
    });

    return verification;
  }

  verifyEmail(userId: string, dto: VerifyEmailDto): UserVerificationEntity {
    const verification = this.createVerification(userId, 'email');
    verification.status = 'approved';
    verification.reviewedAt = new Date();

    this.eventBus.publish({
      type: 'user.email_verified',
      payload: { userId, email: dto.email },
      timestamp: new Date(),
    });

    return verification;
  }

  getByUserId(userId: string): UserVerificationEntity[] {
    return this.verifications.get(userId) ?? [];
  }

  approve(userId: string, verificationId: string, reviewerId: string): UserVerificationEntity {
    const verification = this.findVerification(userId, verificationId);
    verification.status = 'approved';
    verification.reviewedBy = reviewerId;
    verification.reviewedAt = new Date();
    verification.updatedAt = new Date();
    return verification;
  }

  reject(
    userId: string,
    verificationId: string,
    reviewerId: string,
    reason: string,
  ): UserVerificationEntity {
    const verification = this.findVerification(userId, verificationId);
    verification.status = 'rejected';
    verification.reviewedBy = reviewerId;
    verification.reviewedAt = new Date();
    verification.rejectionReason = reason;
    verification.updatedAt = new Date();
    return verification;
  }

  private createVerification(
    userId: string,
    type: UserVerificationEntity['type'],
    documentUrl?: string,
  ): UserVerificationEntity {
    const verification = new UserVerificationEntity();
    verification.id = `verification-${Date.now()}`;
    verification.userId = userId;
    verification.type = type;
    verification.status = 'pending';
    verification.documentUrl = documentUrl;
    verification.createdAt = new Date();
    verification.updatedAt = new Date();

    const existing = this.verifications.get(userId) ?? [];
    this.verifications.set(userId, [...existing, verification]);
    return verification;
  }

  private findVerification(userId: string, verificationId: string): UserVerificationEntity {
    const items = this.verifications.get(userId) ?? [];
    const verification = items.find((v) => v.id === verificationId);

    if (!verification) {
      throw new BadRequestException('Verification request not found');
    }

    return verification;
  }
}
