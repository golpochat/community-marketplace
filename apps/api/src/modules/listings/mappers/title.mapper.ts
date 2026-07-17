import type { TitleChangeLog } from '@community-marketplace/types';

export function mapTitleChangeLog(row: {
  id: string;
  listingId: string;
  sellerId: string;
  oldTitle: string;
  newTitle: string;
  similarityScore: number;
  requiresReview: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes: string | null;
  reviewedById: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  listing?: { id: string; title: string; status: string };
  seller?: { id: string; displayName: string | null; email: string };
}): TitleChangeLog {
  return {
    id: row.id,
    listingId: row.listingId,
    sellerId: row.sellerId,
    oldTitle: row.oldTitle,
    newTitle: row.newTitle,
    similarityScore: row.similarityScore,
    requiresReview: row.requiresReview,
    status: row.status,
    reviewNotes: row.reviewNotes ?? undefined,
    reviewedById: row.reviewedById ?? undefined,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
    listing: row.listing,
    seller: row.seller
      ? {
          id: row.seller.id,
          displayName: row.seller.displayName ?? undefined,
          email: row.seller.email,
        }
      : undefined,
  };
}
