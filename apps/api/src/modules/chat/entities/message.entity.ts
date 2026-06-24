import { BaseEntity } from '../../../common/entities/base.entity';
import type { ChatMessageStatus, ChatMessageType } from '@community-marketplace/types';

export class MessageEntity extends BaseEntity {
  conversationId!: string;
  senderId!: string;
  recipientId!: string;
  listingId?: string;
  type!: ChatMessageType;
  content!: string;
  status!: ChatMessageStatus;
}
