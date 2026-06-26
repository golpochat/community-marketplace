import type {
  ListingUploadUrlResponse,
  PaginatedResult,
  SellerStatusHistoryEntry,
  SellerVerificationRequest,
  SellerVerificationStartResponse,
  SellerVerificationStatus,
} from '@community-marketplace/types';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

export const sellerVerificationService = {
  async getStatus(): Promise<SellerVerificationStatus> {
    const response = await apiClient<SellerVerificationStatus>(
      `${WEB_API_ROUTES.seller.verification}/status`,
    );
    return response.data;
  },

  async start(): Promise<SellerVerificationStartResponse> {
    const response = await apiClient<SellerVerificationStartResponse>(
      `${WEB_API_ROUTES.seller.verification}/start`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    return response.data;
  },

  phone(body: { action: 'send_otp'; phone: string } | { action: 'verify_otp'; phone: string; code: string }) {
    return apiClient(`${WEB_API_ROUTES.seller.verification}/phone`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /** @deprecated Use phone() — kept for gradual migration */
  startLegacy(body: Record<string, unknown>) {
    return apiClient(`${WEB_API_ROUTES.seller.verification}/start`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async requestIdUploadUrl(file: Pick<File, 'type' | 'name'>) {
    const response = await apiClient<ListingUploadUrlResponse>(
      `${WEB_API_ROUTES.seller.verification}/upload-id`,
      {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type, fileName: file.name }),
      },
    );
    return response.data;
  },

  async requestSelfieUploadUrl(file: Pick<File, 'type' | 'name'>) {
    const response = await apiClient<ListingUploadUrlResponse>(
      `${WEB_API_ROUTES.seller.verification}/upload-selfie`,
      {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type, fileName: file.name }),
      },
    );
    return response.data;
  },

  async requestAddressUploadUrl(file: Pick<File, 'type' | 'name'>) {
    const response = await apiClient<ListingUploadUrlResponse>(
      `${WEB_API_ROUTES.seller.verification}/upload-address`,
      {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type, fileName: file.name }),
      },
    );
    return response.data;
  },

  storeDocumentPath(kind: 'id' | 'selfie' | 'address', filePath: string) {
    const route =
      kind === 'id'
        ? 'upload-id'
        : kind === 'selfie'
          ? 'upload-selfie'
          : 'upload-address';
    return apiClient(`${WEB_API_ROUTES.seller.verification}/${route}`, {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
  },

  async uploadDocument(
    file: File,
    kind: 'id' | 'selfie' | 'address',
  ): Promise<string> {
    const upload =
      kind === 'id'
        ? await this.requestIdUploadUrl(file)
        : kind === 'selfie'
          ? await this.requestSelfieUploadUrl(file)
          : await this.requestAddressUploadUrl(file);
    await fetch(upload.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    await this.storeDocumentPath(kind, upload.publicUrl);
    return upload.publicUrl;
  },

  submit(body: {
    idDocumentPath?: string;
    selfiePath?: string;
    addressDocumentPath?: string;
    phoneNumber?: string;
  }) {
    return apiClient<SellerVerificationRequest>(
      `${WEB_API_ROUTES.seller.verification}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  async getStatusHistory(page = 1, limit = 20) {
    const response = await apiClient<
      SellerStatusHistoryEntry[] | PaginatedResult<SellerStatusHistoryEntry>
    >(WEB_API_ROUTES.seller.statusHistory, {
      params: { page: String(page), limit: String(limit) },
    });
    return normalizePaginated(response, { page, limit });
  },
};
