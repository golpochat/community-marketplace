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

@Injectable()
export class ChatThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ChatAccessService,
    private readonly eventBus: EventBusService,
  ) {}

  async create(buyerId: string, role: RbacRole, input: unknown): Promise<ChatThread> {
    await this.access.assertCanSendMessage(buyerId, role);
    const parsed = createChatThreadSchema.parse(input);

    const listing = await this.prisma.listing.findUnique({
      where: { id: parsed.listingId },
      select: { id: true, sellerId: true, status: true },
    });
    if (!listing || listing.status !== 'active') {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId !== parsed.sellerId) {
      throw new BadRequestException('Seller does not own this listing');
    }
    if (buyerId === parsed.sellerId) {
      throw new BadRequestException('Cannot start a thread with yourself');
    }

    const existing = await this.prisma.chatThread.findUnique({
      where: {
        buyerId_sellerId_listingId: {
          buyerId,
          sellerId: parsed.sellerId,
          listingId: parsed.listingId,
        },
      },
    });
    if (existing) return mapChatThread(existing);

    const row = await this.prisma.chatThread.create({
      data: {
        buyerId,
        sellerId: parsed.sellerId,
        listingId: parsed.listingId,
      },
    });

    this.eventBus.publish({
      type: 'chat.thread_created',
      payload: { threadId: row.id, buyerId, sellerId: parsed.sellerId },
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
