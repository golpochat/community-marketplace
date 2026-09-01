import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RbacRole } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { SellerListingGateService } from '../../seller/services/seller-listing-gate.service';

/** Level-3 marketplace participants: buyers and sellers with messaging access. */
const MESSAGING_ROLES: RbacRole[] = ['BUYER', 'SELLER'];

@Injectable()
export class ChatAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sellerGate: SellerListingGateService,
  ) {}

  assertMessagingRole(role: RbacRole) {
    if (!MESSAGING_ROLES.includes(role)) {
      throw new ForbiddenException('Only buyers and sellers can use messaging');
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
    if (role === 'SELLER') {
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

    if (role === 'BUYER') {
      if (userId !== buyerId) {
        throw new ForbiddenException('Buyers can only initiate as themselves');
      }
      await this.assertBuyerCanMessageSeller(sellerId);
      return;
    }

    if (role === 'SELLER') {
      if (userId !== sellerId) {
        throw new ForbiddenException('Sellers can only initiate as themselves');
      }
      await this.assertSellerCanInitiateConversation(sellerId);
      await this.assertUserIsBuyer(buyerId);
    }
  }

  async assertBuyerCanMessageSeller(sellerId: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { primaryRole: { select: { code: true } } },
    });
    if (!seller || seller.primaryRole.code !== 'SELLER') {
      throw new ForbiddenException('Buyers can only message sellers');
    }
  }

  private async assertUserIsBuyer(buyerId: string) {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { primaryRole: { select: { code: true } } },
    });
    if (!buyer || buyer.primaryRole.code !== 'BUYER') {
      throw new ForbiddenException('Sellers can only message buyers');
    }
  }

  async assertSellerCanInitiateConversation(sellerId: string) {
    await this.assertSellerMessagingAllowed(sellerId);

    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        sellerStatus: true,
        unverifiedListingCount: true,
        sellerLimit: true,
      },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    if (seller.sellerStatus === 'verified') {
      return;
    }

    if (
      seller.sellerStatus === 'unverified' &&
      seller.unverifiedListingCount < seller.sellerLimit
    ) {
      return;
    }

    throw new ForbiddenException({
      message:
        'Unverified sellers cannot start new conversations after reaching the listing limit. Complete verification to continue.',
      code: 'SELLER_INITIATION_BLOCKED',
    });
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
