import { Injectable, NotFoundException } from '@nestjs/common';

import type { ChatConversationDetail, RbacRole } from '@community-marketplace/types';
import { sendMessageApiSchema } from '@community-marketplace/validation';

import {
  mapChatMessage,
  mapChatThread,
  mapInboxItem,
  threadInclude,
} from './mappers/chat.mapper';
import { ChatInboxService } from './services/chat-inbox.service';
import { ChatMessagesService } from './services/chat-messages.service';
import { ChatModerationService } from './services/chat-moderation.service';
import { ChatR2StorageService } from './services/chat-r2-storage.service';
import { ChatThreadsService } from './services/chat-threads.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly threads: ChatThreadsService,
    private readonly messages: ChatMessagesService,
    private readonly inbox: ChatInboxService,
    private readonly storage: ChatR2StorageService,
    private readonly moderation: ChatModerationService,
  ) {}

  createThread(userId: string, role: RbacRole, input: unknown) {
    return this.threads.create(userId, role, input);
  }

  getThreadByListing(userId: string, role: RbacRole, listingId: string) {
    return this.threads.findByListing(userId, role, listingId);
  }

  getThread(threadId: string, userId: string, role: RbacRole) {
    return this.threads.getById(threadId, userId, role);
  }

  async getConversationDetail(
    threadId: string,
    userId: string,
    role: RbacRole,
  ): Promise<ChatConversationDetail> {
    await this.threads.getById(threadId, userId, role);
    const thread = await this.threads.getThreadWithRelations(threadId);
    if (!thread) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }

    const messagesResult = await this.messages.list(threadId, userId, role, {
      page: 1,
      limit: 100,
    });

    return {
      thread: mapChatThread(thread),
      messages: messagesResult.data,
      listing: {
        id: thread.listing.id,
        title: thread.listing.title,
        price: Number(thread.listing.price),
        currency: thread.listing.currency,
        imageUrl: thread.listing.images[0]?.url,
        status: thread.listing.status,
      },
      participant: mapInboxItem(thread, undefined, 0, userId).participant,
    };
  }

  listInbox(userId: string, role: RbacRole, input: unknown) {
    return this.inbox.listInbox(userId, role, input);
  }

  blockConversation(threadId: string, userId: string, role: RbacRole) {
    return this.threads.block(threadId, userId, role);
  }

  archiveThread(threadId: string, userId: string, role: RbacRole) {
    return this.threads.archive(threadId, userId, role);
  }

  unarchiveThread(threadId: string, userId: string, role: RbacRole) {
    return this.threads.unarchive(threadId, userId, role);
  }

  listMessages(threadId: string, userId: string, role: RbacRole, input: unknown) {
    return this.messages.list(threadId, userId, role, input);
  }

  sendMessage(senderId: string, role: RbacRole, input: unknown) {
    return this.messages.send(senderId, role, input);
  }

  sendMessageViaApi(senderId: string, role: RbacRole, input: unknown) {
    const parsed = sendMessageApiSchema.parse(input);
    return this.messages.send(senderId, role, {
      threadId: parsed.conversationId,
      content: parsed.messageText,
      messageType: parsed.messageType,
      attachmentUrl: parsed.attachmentUrl,
    });
  }

  reportMessage(reporterId: string, role: RbacRole, input: unknown) {
    return this.moderation.reportMessage(reporterId, role, input);
  }

  editMessage(messageId: string, userId: string, role: RbacRole, input: unknown) {
    return this.messages.edit(messageId, userId, role, input);
  }

  deleteMessage(messageId: string, userId: string, role: RbacRole) {
    return this.messages.remove(messageId, userId, role);
  }

  markRead(userId: string, role: RbacRole, input: unknown) {
    return this.messages.markRead(userId, role, input);
  }

  createAttachmentUploadUrl(
    threadId: string,
    userId: string,
    role: RbacRole,
    input: unknown,
  ) {
    return this.threads.getById(threadId, userId, role).then(() =>
      this.storage.createAttachmentUploadUrl(threadId, userId, input),
    );
  }

  adminGetThread(threadId: string, adminId: string, role: RbacRole) {
    return this.moderation.getThread(threadId, adminId, role);
  }

  adminSearchMessages(input: unknown) {
    return this.moderation.searchMessages(input);
  }

  adminListMessageFlags(input: unknown) {
    return this.moderation.listMessageFlags(input);
  }

  adminResolveMessageFlag(flagId: string, adminId: string, input: unknown) {
    return this.moderation.resolveMessageFlag(flagId, adminId, input);
  }

  adminFlagMessage(reporterId: string, messageId: string, input: unknown) {
    return this.moderation.flagMessage(reporterId, messageId, input);
  }

  adminBanUser(adminId: string, input: unknown) {
    return this.moderation.banUser(adminId, input);
  }
}
