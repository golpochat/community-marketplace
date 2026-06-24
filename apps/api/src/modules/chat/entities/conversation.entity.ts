import { BaseEntity } from '../../../common/entities/base.entity';

export class ConversationEntity extends BaseEntity {
  participantIds!: string[];
  listingId?: string;
  lastMessageId?: string;
  unreadCounts!: Record<string, number>;
}
