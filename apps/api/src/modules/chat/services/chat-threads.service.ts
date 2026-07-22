import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ChatThread, RbacRole } from '@community-marketplace/types';
import { createChatThreadSchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { mapChatThread, threadInclude } from '../mappers/chat.mapper';
import { ChatAccessService } from './chat-access.service';
import { ChatInboxService } from './chat-inbox.service';

@Injectable()
export class ChatThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ChatAccessService,
    private readonly eventBus: EventBusService,
    private readonly inbox: ChatInboxService,
  ) {}

  async create(userId: string, role: RbacRole, input: unknown): Promise<ChatThread> {
    const parsed = createChatThreadSchema.parse(input);

    let buyerId: string;
    let sellerId: string;

    if (role === 'BUYER') {
      if (!parsed.sellerId) {
        throw new BadRequestException('sellerId is required for buyers');
      }
      buyerId = userId;
      sellerId = parsed.sellerId;
    } else if (role === 'SELLER') {
      if (!parsed.buyerId) {
        throw new BadRequestException('buyerId is required for sellers');
      }
      sellerId = userId;
      buyerId = parsed.buyerId;
    } else {
      throw new BadRequestException('Only buyers and sellers can create conversations');
    }

    await this.access.assertCanInitiateConversation(userId, role, buyerId, sellerId);

    const listing = await this.prisma.listing.findUnique({
      where: { id: parsed.listingId },
      select: { id: true, sellerId: true, status: true },
    });
    if (!listing || (listing.status !== 'active' && listing.status !== 'reserved')) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId !== sellerId) {
      throw new BadRequestException('Seller does not own this listing');
    }

    const existing = await this.prisma.chatThread.findUnique({
      where: {
        buyerId_sellerId_listingId: {
          buyerId,
          sellerId,
          listingId: parsed.listingId,
        },
      },
    });
    if (existing) return mapChatThread(existing);

    const row = await this.prisma.chatThread.create({
      data: {
        buyerId,
        sellerId,
        listingId: parsed.listingId,
      },
    });

    this.eventBus.publish({
      type: 'chat.thread_created',
      payload: { threadId: row.id, buyerId, sellerId },
      timestamp: new Date(),
    });

    return mapChatThread(row);
  }

  async findByListing(
    userId: string,
    role: RbacRole,
    listingId: string,
  ): Promise<ChatThread | null> {
    const row = await this.prisma.chatThread.findFirst({
      where: {
        listingId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });
    if (!row) return null;
    await this.access.assertCanAccessThread(row.id, userId, role);
    return mapChatThread(row);
  }

  async getById(
    threadId: string,
    userId: string,
    role: RbacRole,
  ): Promise<ChatThread> {
    await this.access.assertCanAccessThread(threadId, userId, role);
    const row = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
    });
    if (!row) throw new NotFoundException(`Thread ${threadId} not found`);
    return mapChatThread(row);
  }

  async block(threadId: string, userId: string, role: RbacRole): Promise<ChatThread> {
    const thread = await this.access.assertCanAccessThread(threadId, userId, role);

    const row = await this.prisma.chatThread.update({
      where: { id: thread.id },
      data: { isBlocked: true, blockedBy: userId },
    });

    await this.inbox.invalidateInbox(thread.buyerId);
    await this.inbox.invalidateInbox(thread.sellerId);

    return mapChatThread(row);
  }

  async archive(threadId: string, userId: string, role: RbacRole) {
    const thread = await this.access.assertCanAccessThread(threadId, userId, role);
    const data =
      thread.buyerId === userId
        ? { archivedByBuyer: true }
        : { archivedBySeller: true };

    const row = await this.prisma.chatThread.update({
      where: { id: threadId },
      data,
    });
    return mapChatThread(row);
  }

  async unarchive(threadId: string, userId: string, role: RbacRole) {
    const thread = await this.access.assertCanAccessThread(threadId, userId, role);
    const data =
      thread.buyerId === userId
        ? { archivedByBuyer: false }
        : { archivedBySeller: false };

    const row = await this.prisma.chatThread.update({
      where: { id: threadId },
      data,
    });
    return mapChatThread(row);
  }

  async getThreadWithRelations(threadId: string) {
    return this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: threadInclude,
    });
  }
}
