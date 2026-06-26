import type {
  ListingUploadUrlResponse,
  SellerVerificationRequest,
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

  start(body: Record<string, unknown>) {
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

  async uploadDocument(
    file: File,
    kind: 'id' | 'selfie',
  ): Promise<string> {
    const upload =
      kind === 'id'
        ? await this.requestIdUploadUrl(file)
        : await this.requestSelfieUploadUrl(file);
    await fetch(upload.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    return upload.publicUrl;
  },

  submit(body: {
    idDocumentPath: string;
    selfiePath: string;
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
};
