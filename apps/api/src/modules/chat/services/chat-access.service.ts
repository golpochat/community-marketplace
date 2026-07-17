import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RbacRole } from '@community-marketplace/types';
import {
  canActAsBuyer,
  canEnterSellerNamespace,
  hasLegacySellerRole,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { SellerListingGateService } from '../../seller/services/seller-listing-gate.service';

/** Level-3 marketplace participants with messaging access. */
const MARKETPLACE_MESSAGING_ROLES: RbacRole[] = ['MEMBER', 'BUYER', 'SELLER'];

@Injectable()
export class ChatAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sellerGate: SellerListingGateService,
  ) {}

  assertMessagingRole(role: RbacRole) {
    if (
      !MARKETPLACE_MESSAGING_ROLES.includes(role) &&
      !canActAsBuyer(role) &&
      !canEnterSellerNamespace(role)
    ) {
      throw new ForbiddenException('Only marketplace members can use messaging');
    }
  }

  async assertCanAccessThread(
    threadId: string,
    userId: string,
    role: RbacRole,
  ) {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundException(`Thread ${threadId} not found`);

    const isParticipant =
      thread.buyerId === userId || thread.sellerId === userId;
    const isModerator = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isParticipant && !isModerator) {
      throw new ForbiddenException('You cannot access this thread');
    }

    if (!isModerator) {
      await this.assertNotChatBanned(userId);
      if (thread.sellerId === userId) {
        await this.assertSellerMessagingAllowed(userId);
      }
      if (thread.isBlocked) {
        throw new ForbiddenException('This conversation is blocked');
      }
    }

    return thread;
  }

  async assertCanSendMessage(userId: string, role: RbacRole) {
    this.assertMessagingRole(role);
    await this.assertNotChatBanned(userId);
    if (role === 'SELLER' || (role === 'MEMBER' && (await this.hasSellerCapability(userId, role)))) {
      await this.assertSellerMessagingAllowed(userId);
    }
  }

  async assertCanInitiateConversation(
    userId: string,
    role: RbacRole,
    buyerId: string,
    sellerId: string,
  ) {
    await this.assertCanSendMessage(userId, role);

    if (buyerId === sellerId) {
      throw new ForbiddenException('Cannot start a conversation with yourself');
    }

    if (role === 'BUYER' || role === 'MEMBER') {
      if (userId === buyerId) {
        await this.assertBuyerCanMessageSeller(sellerId);
        return;
      }
      if (userId === sellerId) {
        await this.assertCanSell(userId, role);
        await this.assertSellerCanInitiateConversation(sellerId);
        await this.assertUserCanBeBuyer(buyerId);
        return;
      }
      throw new ForbiddenException('You can only initiate as yourself in this conversation');
    }

    if (role === 'SELLER') {
      if (userId !== sellerId) {
        throw new ForbiddenException('Sellers can only initiate as themselves');
      }
      await this.assertSellerCanInitiateConversation(sellerId);
      await this.assertUserCanBeBuyer(buyerId);
    }
  }

  async assertBuyerCanMessageSeller(sellerId: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { primaryRole: { select: { code: true } } },
    });
    if (!seller) {
      throw new ForbiddenException('Buyers can only message sellers');
    }

    const sellerRole = seller.primaryRole.code as RbacRole;
    const canReceiveMessages = await this.hasSellerCapability(sellerId, sellerRole);
    if (!canReceiveMessages) {
      throw new ForbiddenException('Buyers can only message sellers');
    }
  }

  private async assertUserCanBeBuyer(buyerId: string) {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { primaryRole: { select: { code: true } } },
    });
    if (!buyer || !canActAsBuyer(buyer.primaryRole.code as RbacRole)) {
      throw new ForbiddenException('Sellers can only message buyers');
    }
  }

  private async hasSellerCapability(userId: string, role?: RbacRole): Promise<boolean> {
    if (role && hasLegacySellerRole(role)) return true;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sellerOnboardingStartedAt: true },
    });

    return Boolean(user?.sellerOnboardingStartedAt);
  }

  private async assertCanSell(userId: string, role?: RbacRole): Promise<void> {
    if (await this.hasSellerCapability(userId, role)) return;

    throw new ForbiddenException({
      message:
        'Start selling from your account to message buyers as a seller. Complete seller setup first.',
      code: 'SELLER_ONBOARDING_REQUIRED',
    });
  }

  async assertSellerCanInitiateConversation(sellerId: string) {
    await this.assertSellerMessagingAllowed(sellerId);

    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        sellerStatus: true,
        approvedListingCount: true,
        unverifiedListingCount: true,
        sellerLimit: true,
      },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    if (seller.sellerStatus === 'verified') {
      return;
    }

    if (
      seller.sellerStatus === 'verification_required' ||
      seller.sellerStatus === 'under_review' ||
      seller.sellerStatus === 'suspended'
    ) {
      throw new ForbiddenException({
        message:
          'You cannot start new conversations until your seller account is verified. Complete verification to continue.',
        code: 'SELLER_INITIATION_BLOCKED',
      });
    }

    // unverified: allowed (same predicate as listing create — status-based only)
  }

  private async assertSellerMessagingAllowed(userId: string) {
    await this.sellerGate.assertSellerNotSuspended(userId);
  }

  async assertNotChatBanned(userId: string) {
    const ban = await this.prisma.chatBan.findFirst({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (ban) {
      throw new ForbiddenException('You are banned from chat');
    }
  }
}
