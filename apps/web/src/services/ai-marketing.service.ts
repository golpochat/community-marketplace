import type {
  AiBannerFormat,
  AiBannerTemplate,
  AiBestPostingTimeResult,
  AiMarketingApplyImageResult,
  AiMarketingGenerateResult,
  AiMarketingImageResult,
  AiMarketingQuotaSummary,
  AiMarketingTask,
  AiPriceSuggestionResult,
  ListingImage,
} from '@community-marketplace/types';

import { apiClient, ApiClientError } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { resolveClientAccessToken, refreshClientSession } from '@/lib/web-session';

export interface AiMarketingGeneratePayload {
  task: AiMarketingTask;
  listingId?: string;
  title?: string;
  description?: string;
  categoryName?: string;
  condition?: string;
  location?: string;
  price?: string | number;
}

export interface AiMarketingImagePayload {
  task: 'image_enhance' | 'image_bg_remove' | 'banner_creator';
  listingId: string;
  imageId: string;
  bannerFormat?: AiBannerFormat;
  bannerTemplate?: AiBannerTemplate;
  includeWatermark?: boolean;
  includeStoreLogo?: boolean;
}

export interface AiMarketingPriceSuggestPayload {
  listingId?: string;
  categoryId?: string;
  condition?: string;
  location?: string;
  make?: string;
  model?: string;
  year?: string | number;
}

export interface AiMarketingBestPostingTimePayload {
  listingId?: string;
  categoryId?: string;
}

export const aiMarketingService = {
  async getQuota() {
    const response = await apiClient<AiMarketingQuotaSummary>(
      WEB_API_ROUTES.seller.marketingHubQuota,
    );
    return response.data!;
  },

  async generate(payload: AiMarketingGeneratePayload) {
    const response = await apiClient<AiMarketingGenerateResult>(
      WEB_API_ROUTES.seller.marketingHubGenerate,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return response.data!;
  },

  async processImage(payload: AiMarketingImagePayload) {
    const response = await apiClient<AiMarketingImageResult>(
      WEB_API_ROUTES.seller.marketingHubImage,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return response.data!;
  },

  async applyImageToListing(generationId: string) {
    const response = await apiClient<AiMarketingApplyImageResult>(
      WEB_API_ROUTES.seller.marketingHubImageApply,
      {
        method: 'POST',
        body: JSON.stringify({ generationId }),
      },
    );
    return response.data!;
  },

  async suggestPrice(payload: AiMarketingPriceSuggestPayload) {
    const response = await apiClient<AiPriceSuggestionResult>(
      WEB_API_ROUTES.seller.marketingHubPriceSuggest,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return response.data!;
  },

  async bestPostingTime(payload: AiMarketingBestPostingTimePayload) {
    const response = await apiClient<AiBestPostingTimeResult>(
      WEB_API_ROUTES.seller.marketingHubBestPostingTime,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return response.data!;
  },

  async downloadCampaignPack(listingId: string) {
    const url = `${API_BASE_URL}${WEB_API_ROUTES.seller.marketingHubCampaignPack}`;
    let token = resolveClientAccessToken();

    const doFetch = (bearer: string | null) =>
      fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify({ listingId }),
      });

    let response = await doFetch(token);
    if (response.status === 401) {
      const refreshed = await refreshClientSession();
      if (refreshed) {
        token = refreshed;
        response = await doFetch(token);
      }
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as {
        message?: string;
        code?: string;
      } | null;
      throw new ApiClientError(
        error?.message ?? `Request failed with status ${response.status}`,
        response.status,
        error?.code,
      );
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match?.[1] ?? `sellnearby-campaign-${listingId.slice(0, 8)}.zip`;
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  },

  async listListingImages(listingId: string) {
    const response = await apiClient<ListingImage[]>(
      WEB_API_ROUTES.seller.listingImages(listingId),
    );
    return Array.isArray(response.data) ? response.data : [];
  },
};
