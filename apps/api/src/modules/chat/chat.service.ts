import { Injectable } from '@nestjs/common';

import type { RbacRole } from '@community-marketplace/types';

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

  listInbox(userId: string, role: RbacRole, input: unknown) {
    return this.inbox.listInbox(userId, role, input);
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

  adminFlagMessage(reporterId: string, messageId: string, input: unknown) {
    return this.moderation.flagMessage(reporterId, messageId, input);
  }

  adminBanUser(adminId: string, input: unknown) {
    return this.moderation.banUser(adminId, input);
  }
}
