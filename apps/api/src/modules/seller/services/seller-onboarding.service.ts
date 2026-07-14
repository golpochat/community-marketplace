import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import type { SellerRegistrationKind } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { SellerCapabilityService } from './seller-capability.service';

@Injectable()
export class SellerOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sellerCapability: SellerCapabilityService,
  ) {}

  async startSelling(userId: string, sellerKind: SellerRegistrationKind) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, primaryRole: true },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    if (user.sellerOnboardingStartedAt) {
      return {
        alreadyStarted: true as const,
        status: await this.sellerCapability.getOnboardingStatus(userId),
      };
    }

    const isBusiness = sellerKind === 'sole_trader' || sellerKind === 'limited_company';
    const displayName = user.displayName ?? user.profile?.phone ?? 'Seller';
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          sellerOnboardingStartedAt: now,
          sellerStatus: user.sellerStatus === 'verified' ? user.sellerStatus : 'unverified',
        },
      });

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          phone: user.profile?.phone ?? '',
          businessStructure: sellerKind,
          isBusinessAccount: isBusiness,
          ...(isBusiness ? { businessName: displayName } : {}),
        },
        update: {
          businessStructure: sellerKind,
          isBusinessAccount: isBusiness,
          ...(isBusiness ? { businessName: displayName } : {}),
        },
      });
    });

    if (user.primaryRole.code === 'MEMBER') {
      await this.sellerCapability.grantSellerCapabilities(userId, userId);
    }

    return {
      alreadyStarted: false as const,
      status: await this.sellerCapability.getOnboardingStatus(userId),
    };
  }
}
