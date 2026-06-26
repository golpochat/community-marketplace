import type {
  DisputeEvidence,
  DisputeMessage,
  DisputeTimelineEvent,
  MarketplaceDispute,
  MarketplaceDisputeStatus,
} from '@community-marketplace/types';
import { DISPUTE_REASON_LABELS, DISPUTE_STATUS_LABELS } from '@community-marketplace/types';
import type {
  DisputeEvidence as PrismaEvidence,
  DisputeMessage as PrismaMessage,
  MarketplaceDispute as PrismaDispute,
} from '@prisma/client';

type DisputeWithRelations = PrismaDispute & {
  buyer?: { id: string; displayName?: string | null };
  seller?: { id: string; displayName?: string | null };
  listing?: { id: string; title: string; price: unknown; currency: string };
  evidence?: PrismaEvidence[];
  messages?: PrismaMessage[];
};

function displayName(user?: { displayName?: string | null }): string | undefined {
  return user?.displayName ?? undefined;
}

function mapEvidence(
  row: PrismaEvidence,
  fileUrl?: string,
): DisputeEvidence {
  return {
    id: row.id,
    disputeId: row.disputeId,
    uploadedById: row.uploadedById,
    uploaderRole: row.uploaderRole,
    filePath: row.filePath,
    fileUrl,
    description: row.description ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapMessage(
  row: PrismaMessage & { sender?: { id: string; displayName?: string | null } },
): DisputeMessage {
  return {
    id: row.id,
    disputeId: row.disputeId,
    senderId: row.senderId,
    senderName: displayName(row.sender),
    messageText: row.messageText,
    createdAt: row.createdAt.toISOString(),
  };
}

export function buildDisputeTimeline(dispute: MarketplaceDispute): DisputeTimelineEvent[] {
  const events: DisputeTimelineEvent[] = [
    {
      id: `created-${dispute.id}`,
      type: 'created',
      label: 'Dispute opened',
      detail: DISPUTE_REASON_LABELS[dispute.reason as keyof typeof DISPUTE_REASON_LABELS] ?? dispute.reason,
      actorId: dispute.buyerId,
      actorName: dispute.buyer?.displayName,
      createdAt: dispute.createdAt,
    },
  ];

  for (const message of dispute.messages ?? []) {
    events.push({
      id: `message-${message.id}`,
      type: 'message',
      label: 'Message',
      detail: message.messageText,
      actorId: message.senderId,
      actorName: message.senderName,
      createdAt: message.createdAt,
    });
  }

  for (const item of dispute.evidence ?? []) {
    events.push({
      id: `evidence-${item.id}`,
      type: 'evidence',
      label: 'Evidence uploaded',
      detail: item.description,
      actorId: item.uploadedById,
      createdAt: item.createdAt,
      metadata: { fileUrl: item.fileUrl, uploaderRole: item.uploaderRole },
    });
  }

  if (dispute.resolvedAt) {
    events.push({
      id: `resolution-${dispute.id}`,
      type: 'resolution',
      label: DISPUTE_STATUS_LABELS[dispute.disputeStatus],
      detail: dispute.resolutionNotes,
      actorId: dispute.resolvedById,
      createdAt: dispute.resolvedAt,
    });
  }

  return events.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function mapDispute(
  row: DisputeWithRelations,
  evidenceUrls?: Map<string, string>,
): MarketplaceDispute {
  const evidence = (row.evidence ?? []).map((item) =>
    mapEvidence(item, evidenceUrls?.get(item.filePath)),
  );
  const messages = (row.messages ?? []).map((item) => mapMessage(item));

  const dispute: MarketplaceDispute = {
    id: row.id,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    listingId: row.listingId,
    paymentId: row.paymentId ?? undefined,
    reason: row.reason as MarketplaceDispute['reason'],
    description: row.description,
    disputeStatus: row.disputeStatus as MarketplaceDisputeStatus,
    resolutionNotes: row.resolutionNotes ?? undefined,
    resolvedById: row.resolvedById ?? undefined,
    resolvedAt: row.resolvedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    buyer: row.buyer
      ? { id: row.buyer.id, displayName: displayName(row.buyer) }
      : undefined,
    seller: row.seller
      ? { id: row.seller.id, displayName: displayName(row.seller) }
      : undefined,
    listing: row.listing
      ? {
          id: row.listing.id,
          title: row.listing.title,
          price: Number(row.listing.price),
          currency: row.listing.currency,
        }
      : undefined,
    evidence,
    messages,
  };

  dispute.timeline = buildDisputeTimeline(dispute);
  return dispute;
}
