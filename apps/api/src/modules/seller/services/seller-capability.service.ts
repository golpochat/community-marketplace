import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PERMISSIONS,
  type PermissionCode,
  type RbacRole,
  hasLegacySellerRole,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

/** Seller permissions granted when a MEMBER starts selling. */
export const SELLER_CAPABILITY_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.CREATE_LISTING,
  PERMISSIONS.EDIT_LISTING,
  PERMISSIONS.DELETE_LISTING,
  PERMISSIONS.RECEIVE_PAYMENT,
];

@Injectable()
export class SellerCapabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async hasSellerCapability(userId: string, role?: RbacRole): Promise<boolean> {
    if (role && hasLegacySellerRole(role)) return true;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sellerOnboardingStartedAt: true },
    });

    return Boolean(user?.sellerOnboardingStartedAt);
  }

  async assertCanSell(userId: string, role?: RbacRole): Promise<void> {
    if (await this.hasSellerCapability(userId, role)) return;

    throw new ForbiddenException({
      message:
        'Start selling from your account to list items. Complete seller setup to access seller tools.',
      code: 'SELLER_ONBOARDING_REQUIRED',
    });
  }

  async grantSellerCapabilities(userId: string, grantedById?: string): Promise<void> {
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: [...SELLER_CAPABILITY_PERMISSIONS] } },
      select: { id: true, code: true },
    });

    for (const permission of permissions) {
      await this.prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id,
          },
        },
        create: {
          userId,
          permissionId: permission.id,
          effect: 'GRANT',
          reason: 'Seller onboarding started',
          grantedById: grantedById ?? userId,
        },
        update: {
          effect: 'GRANT',
          reason: 'Seller onboarding started',
        },
      });
    }
  }

  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        sellerOnboardingStartedAt: true,
        sellerStatus: true,
        profile: {
          select: {
            businessStructure: true,
            isBusinessAccount: true,
            businessName: true,
          },
        },
        _count: {
          select: { stores: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const storeCount = user._count.stores;

    return {
      started: Boolean(user.sellerOnboardingStartedAt),
      startedAt: user.sellerOnboardingStartedAt?.toISOString() ?? null,
      sellerStatus: user.sellerStatus,
      businessStructure: user.profile?.businessStructure ?? null,
      isBusinessAccount: user.profile?.isBusinessAccount ?? false,
      businessName: user.profile?.businessName ?? null,
      storeCount,
      hasStorefront: storeCount > 0,
    };
  }
}
