import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RbacRole } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatAccessService {
  constructor(private readonly prisma: PrismaService) {}

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
    }

    return thread;
  }

  async assertCanSendMessage(userId: string, role: RbacRole) {
    if (role !== 'BUYER' && role !== 'SELLER') {
      throw new ForbiddenException('Only buyers and sellers can send messages');
    }
    await this.assertNotChatBanned(userId);
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
