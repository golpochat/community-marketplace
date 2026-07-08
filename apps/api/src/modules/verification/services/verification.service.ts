import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  type AcceleratedVerificationSignals,
  type PersonalDetailsSnapshot,
  type SellerVerificationNextStep,
  type SellerVerificationStatus,
  type UnifiedVerificationContext,
  type UnifiedVerificationState,
  VERIFICATION_ONBOARDING_COPY,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import {
  buildAcceleratedSignals,
  buildPersonalDetailsSnapshot,
  mapSellerStatusToUnifiedState,
  parsePersonalDetailsUpdate,
  resolveNextStepFromStatus,
  resolveUnifiedVerificationStage,
} from '../models/verification-state.model';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getPersonalDetailsSnapshot(userId: string): Promise<PersonalDetailsSnapshot> {
    const user = await this.loadUserVerificationFields(userId);
    return this.snapshotFromUser(user);
  }

  async getAcceleratedSignals(userId: string): Promise<AcceleratedVerificationSignals> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stripeConnectAccount: {
          select: { chargesEnabled: true, payoutsEnabled: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const phoneVerified = user.phoneVerified || Boolean(user.phoneVerifiedAt);
    const emailVerified = user.emailVerified || Boolean(user.emailVerifiedAt);

    return buildAcceleratedSignals({
      phoneVerified,
      emailVerified,
      phoneVerifiedAt: user.phoneVerifiedAt,
      stripeChargesEnabled: user.stripeConnectAccount?.chargesEnabled,
      stripePayoutsEnabled: user.stripeConnectAccount?.payoutsEnabled,
    });
  }

  async getUnifiedContext(userId: string): Promise<UnifiedVerificationContext> {
    const user = await this.loadUserVerificationFields(userId);
    const personalDetails = this.snapshotFromUser(user);
    const acceleratedSignals = await this.getAcceleratedSignals(userId);

    return {
      unifiedState: this.resolveUnifiedStateFromUser(user),
      personalDetails,
      acceleratedSignals,
    };
  }

  async assertPersonalDetailsComplete(userId: string): Promise<PersonalDetailsSnapshot> {
    const snapshot = await this.getPersonalDetailsSnapshot(userId);
    if (!snapshot.complete) {
      throw new BadRequestException({
        message: VERIFICATION_ONBOARDING_COPY.PERSONAL_DETAILS_REQUIRED,
        code: 'PERSONAL_DETAILS_INCOMPLETE',
        missingFields: snapshot.missingFields,
      });
    }
    return snapshot;
  }

  /**
   * Fast-track is accelerated review — personal details must still be complete.
   */
  async assertAcceleratedVerificationAllowed(userId: string): Promise<void> {
    await this.assertPersonalDetailsComplete(userId);
  }

  async savePersonalDetails(
    userId: string,
    input: unknown,
  ): Promise<PersonalDetailsSnapshot> {
    const parsed = parsePersonalDetailsUpdate(input);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (parsed.email && parsed.email !== user.email && !user.emailVerified) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { email: parsed.email },
      });
    }

    const profileUpdate: Record<string, unknown> = {};

    if (parsed.legalName) {
      profileUpdate.legalName = parsed.legalName;
    }
    if (parsed.registeredCompanyName !== undefined) {
      profileUpdate.registeredCompanyName = parsed.registeredCompanyName;
    }
    if (parsed.croNumber !== undefined) {
      profileUpdate.croNumber = parsed.croNumber;
    }
    if (parsed.businessStructure !== undefined) {
      profileUpdate.businessStructure = parsed.businessStructure;
      profileUpdate.isBusinessAccount = parsed.businessStructure !== 'individual';
    }

    if (parsed.phone) {
      profileUpdate.phone = parsed.phone;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            upsert: {
              create: profileUpdate,
              update: profileUpdate,
            },
          },
        },
      });
    }

    return this.getPersonalDetailsSnapshot(userId);
  }

  assertCanBeginVerification(status: Pick<SellerVerificationStatus, 'sellerStatus' | 'verificationRequestedAt'>) {
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

  resolveNextStep(
    status: Pick<
      SellerVerificationStatus,
      | 'sellerStatus'
      | 'verificationRequestedAt'
      | 'phoneVerified'
      | 'emailVerified'
      | 'idVerified'
      | 'personalDetailsComplete'
      | 'personalDetailsNameComplete'
    >,
    request?: {
      idDocumentPath?: string | null;
      selfiePath?: string | null;
      addressDocumentPath?: string | null;
    } | null,
  ): SellerVerificationNextStep {
    return resolveNextStepFromStatus({
      sellerStatus: status.sellerStatus,
      verificationRequestedAt: status.verificationRequestedAt,
      phoneVerified: status.phoneVerified,
      emailVerified: status.emailVerified,
      personalDetailsNameComplete: status.personalDetailsNameComplete ?? false,
      personalDetailsComplete: status.personalDetailsComplete ?? false,
      idVerified: status.idVerified,
      idDocumentPath: request?.idDocumentPath,
      selfiePath: request?.selfiePath,
      addressDocumentPath: request?.addressDocumentPath,
    });
  }

  resolveStage(input: {
    phoneVerified: boolean;
    emailVerified: boolean;
    personalDetailsNameComplete: boolean;
    personalDetailsComplete: boolean;
    sellerStatus: SellerVerificationStatus['sellerStatus'];
    verificationSubmitted: boolean;
    idVerified: boolean;
  }) {
    return resolveUnifiedVerificationStage(input);
  }

  resolveUnifiedState(input: {
    sellerStatus: SellerVerificationStatus['sellerStatus'];
    verificationRequestedAt?: string | Date | null;
    idVerified?: boolean;
  }): UnifiedVerificationState {
    return mapSellerStatusToUnifiedState(input);
  }

  private snapshotFromUser(user: Awaited<ReturnType<typeof this.loadUserVerificationFields>>) {
    const phoneVerified = user.phoneVerified || Boolean(user.phoneVerifiedAt);
    const emailVerified = user.emailVerified || Boolean(user.emailVerifiedAt);

    return buildPersonalDetailsSnapshot({
      legalName: user.profile?.legalName,
      displayName: user.displayName,
      email: user.email,
      phone: user.profile?.phone,
      emailVerified,
      phoneVerified,
      isBusinessAccount: user.profile?.isBusinessAccount,
      businessStructure: user.profile?.businessStructure,
      businessName: user.profile?.businessName,
      registeredCompanyName: user.profile?.registeredCompanyName,
      croNumber: user.profile?.croNumber,
    });
  }

  private resolveUnifiedStateFromUser(
    user: Awaited<ReturnType<typeof this.loadUserVerificationFields>>,
  ): UnifiedVerificationState {
    return mapSellerStatusToUnifiedState({
      sellerStatus: user.sellerStatus,
      verificationRequestedAt: user.verificationRequestedAt,
      idVerified: user.idVerified,
    });
  }

  private loadUserVerificationFields(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        displayName: true,
        email: true,
        phoneVerified: true,
        phoneVerifiedAt: true,
        emailVerified: true,
        emailVerifiedAt: true,
        sellerStatus: true,
        idVerified: true,
        verificationRequestedAt: true,
        profile: {
          select: {
            phone: true,
            legalName: true,
            isBusinessAccount: true,
            businessStructure: true,
            businessName: true,
            registeredCompanyName: true,
            croNumber: true,
          },
        },
      },
    });
  }
}
