import type { Prisma } from '@prisma/client';

import type {
  ChatInboxItem,
  ChatMessage,
  ChatThread,
} from '@community-marketplace/types';

export const threadInclude = {
  buyer: {
    include: {
      primaryRole: true,
      verifications: {
        where: { badgeGranted: true, status: 'approved' },
        take: 1,
      },
    },
  },
  seller: {
    include: {
      primaryRole: true,
      verifications: {
        where: { badgeGranted: true, status: 'approved' },
        take: 1,
      },
    },
  },
  listing: {
    include: {
      images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
    },
  },
} satisfies Prisma.ChatThreadInclude;

export type ThreadWithRelations = Prisma.ChatThreadGetPayload<{
  include: typeof threadInclude;
}>;

export function mapChatMessage(row: {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachmentUrl: string | null;
  readBy: string[];
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}): ChatMessage {
  return {
    id: row.id,
    threadId: row.threadId,
    senderId: row.senderId,
    content: row.deletedAt ? '[Message deleted]' : row.content,
    messageType: row.messageType as ChatMessage['messageType'],
    attachmentUrl: row.attachmentUrl ?? undefined,
    readBy: row.readBy,
    editedAt: row.editedAt?.toISOString(),
    deletedAt: row.deletedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapChatThread(row: {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  lastMessageAt: Date | null;
  archivedByBuyer: boolean;
  archivedBySeller: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ChatThread {
  return {
    id: row.id,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    listingId: row.listingId,
    lastMessageAt: row.lastMessageAt?.toISOString(),
    archivedByBuyer: row.archivedByBuyer,
    archivedBySeller: row.archivedBySeller,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapInboxItem(
  thread: ThreadWithRelations,
  lastMessage: ChatMessage | undefined,
  unreadCount: number,
  viewerId: string,
): ChatInboxItem {
  const participant =
    thread.buyerId === viewerId ? thread.seller : thread.buyer;

  return {
    thread: mapChatThread(thread),
    lastMessage,
    unreadCount,
    listing: {
      id: thread.listing.id,
      title: thread.listing.title,
      price: Number(thread.listing.price),
      currency: thread.listing.currency,
      imageUrl: thread.listing.images[0]?.url,
      status: thread.listing.status,
    },
    participant: {
      id: participant.id,
      displayName: participant.displayName ?? undefined,
      avatarUrl: participant.avatarUrl ?? undefined,
      role: participant.primaryRole.code,
      verificationBadge: participant.verifications.length > 0,
    },
  };
}
