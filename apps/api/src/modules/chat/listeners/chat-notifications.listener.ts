import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ChatInboxService } from '../services/chat-inbox.service';

@Injectable()
export class ChatNotificationsListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly inbox: ChatInboxService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('chat.message_sent', (event) => {
      void this.onMessageSent(event.payload);
    });
    this.eventBus.subscribe('chat.thread_created', (event) => {
      void this.onThreadCreated(event.payload);
    });
    this.eventBus.subscribe('chat.messages_read', (event) => {
      void this.onMessagesRead(event.payload);
    });
  }

  private async onMessageSent(payload: Record<string, unknown>) {
    const recipientId = payload.recipientId as string;
    const threadId = payload.threadId as string;
    const senderId = payload.senderId as string;

    if (!(await this.shouldNotify(recipientId, 'messageAlerts'))) return;

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true, email: true },
    });

    await this.notifications.send({
      userId: recipientId,
      type: 'new_message',
      title: 'New message',
      body: `${sender?.displayName ?? sender?.email ?? 'Someone'} sent you a message`,
      actionUrl: `/chat?thread=${threadId}`,
    });

    await this.inbox.invalidateInbox(recipientId);
    await this.inbox.invalidateInbox(senderId);
  }

  private async onThreadCreated(payload: Record<string, unknown>) {
    const buyerId = payload.buyerId as string;
    const sellerId = payload.sellerId as string;
    const threadId = payload.threadId as string;

    await this.inbox.invalidateInbox(buyerId);
    await this.inbox.invalidateInbox(sellerId);

    if (!(await this.shouldNotify(sellerId, 'messageAlerts'))) return;

    await this.notifications.send({
      userId: sellerId,
      type: 'thread_created',
      title: 'New conversation',
      body: 'A buyer started a conversation about your listing',
      actionUrl: `/chat?thread=${threadId}`,
    });
  }

  private async onMessagesRead(payload: Record<string, unknown>) {
    const threadId = payload.threadId as string;
    const readerId = payload.readerId as string;

    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) return;

    const notifyUserId =
      thread.buyerId === readerId ? thread.sellerId : thread.buyerId;

    if (!(await this.shouldNotify(notifyUserId, 'messageAlerts'))) return;

    await this.notifications.send({
      userId: notifyUserId,
      type: 'message_read',
      title: 'Message read',
      body: 'Your message was read',
      actionUrl: `/chat?thread=${threadId}`,
    });
  }

  private async shouldNotify(
    userId: string,
    prefKey: 'messageAlerts' | 'push',
  ): Promise<boolean> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!settings) return true;

    const prefs = settings.notificationPreferences as Record<string, boolean>;
    if (prefs.push === false) return false;
    if (prefKey === 'messageAlerts' && prefs.messageAlerts === false) return false;
    return true;
  }
}
