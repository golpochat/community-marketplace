import type { ShareAnalyticsSummary, SharePlatform, ShortLinkResult } from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';

export const shareService = {
  async shorten(listingId: string): Promise<ShortLinkResult> {
    const response = await apiClient<ShortLinkResult>('/share/shorten', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
    return response.data;
  },

  track(listingId: string, platform: SharePlatform): void {
    void apiClient('/share/track', {
      method: 'POST',
      body: JSON.stringify({ listingId, platform }),
    }).catch(() => {
      // Non-blocking analytics
    });
  },

  async getSellerAnalytics(): Promise<ShareAnalyticsSummary> {
    const response = await apiClient<ShareAnalyticsSummary>('/seller/analytics/shares');
    return response.data;
  },
};

export function buildShareLinks(shortUrl: string, shareText: string, title: string) {
  const encodedUrl = encodeURIComponent(shortUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}`,
    messenger: `fb-messenger://share?link=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
    instagram: `https://www.instagram.com/`,
  };
}
