export type SharePlatform =
  | 'WHATSAPP'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'MESSENGER'
  | 'X'
  | 'TELEGRAM'
  | 'EMAIL'
  | 'COPY_LINK'
  | 'QR'
  | 'NATIVE';

export interface ShortLinkResult {
  shortCode: string;
  shortUrl: string;
  shareText: string;
  listingId: string;
}

export interface ListingShareRecord {
  id: string;
  listingId: string;
  sellerId: string;
  platform: SharePlatform;
  createdAt: string;
}

export interface ShareAnalyticsSummary {
  totalShares: number;
  totalClicks: number;
  clickThroughRate: number;
  sharesByPlatform: Array<{ platform: SharePlatform; count: number }>;
  sharesOverTime: Array<{ date: string; count: number }>;
  topListings: Array<{
    listingId: string;
    title: string;
    shareCount: number;
    clickCount: number;
    clickThroughRate: number;
  }>;
}
