import type { Prisma } from '@prisma/client';

import type {
  ChatInboxItem,
  ChatListingPreview,
  ChatMessage,
  ChatThread,
} from '@community-marketplace/types';

import { mapListingImage } from '../../listings/mappers/listing.mapper';
import { resolveOptionalAssetPublicUrl } from '../../../libs/asset-url.lib';

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

export function chatListingImageUrl(
  image: { id: string; listingId: string; url: string; sortOrder: number } | undefined,
): string | undefined {
  if (!image) {
    return undefined;
  }
  const mapped = mapListingImage(image);
  return mapped.thumbUrl ?? mapped.url;
}

export function mapChatMessage(row: {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachmentUrl: string | null;
  isPriority?: boolean;
  priorityUntil?: Date | null;
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
    attachmentUrl: resolveOptionalAssetPublicUrl(row.attachmentUrl),
    isPriority: Boolean(row.isPriority),
    priorityUntil: row.priorityUntil?.toISOString(),
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
  lastMessagePreview: string | null;
  priorityBoostUntil?: Date | null;
  isBlocked: boolean;
  blockedBy: string | null;
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
    lastMessagePreview: row.lastMessagePreview ?? undefined,
    priorityBoostUntil: row.priorityBoostUntil?.toISOString(),
    isBlocked: row.isBlocked,
    blockedBy: row.blockedBy ?? undefined,
    archivedByBuyer: row.archivedByBuyer,
    archivedBySeller: row.archivedBySeller,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapChatListingPreview(
  listing: ThreadWithRelations['listing'],
): ChatListingPreview {
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    title: listing.title,
    price: Number(listing.price),
    currency: listing.currency,
    imageUrl: chatListingImageUrl(listing.images[0]),
    status: listing.status,
  };
}

export function mapInboxItem(
  thread: ThreadWithRelations,
  lastMessage: ChatMessage | undefined,
  unreadCount: number,
  viewerId: string,
  now = new Date(),
): ChatInboxItem {
  const participant =
    thread.buyerId === viewerId ? thread.seller : thread.buyer;
  const priorityBoostUntil = thread.priorityBoostUntil ?? null;
  const hasPriority = Boolean(priorityBoostUntil && priorityBoostUntil > now);

  return {
    thread: mapChatThread(thread),
    lastMessage,
    unreadCount,
    hasPriority,
    listing: mapChatListingPreview(thread.listing),
    participant: {
      id: participant.id,
      displayName: participant.displayName ?? undefined,
      avatarUrl: resolveOptionalAssetPublicUrl(participant.avatarUrl),
      role: participant.primaryRole.code,
      verificationBadge:
        participant.id === thread.sellerId &&
        (participant.sellerStatus === 'verified' ||
          Boolean(participant.idVerified) ||
          participant.verifications.length > 0),
    },
  };
}
