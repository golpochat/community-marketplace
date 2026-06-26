import type {
  AvatarUploadUrlResponse,
  MarketplaceDispute,
  PaginatedResult,
} from '@community-marketplace/types';
import type { CreateDisputeInput } from '@community-marketplace/validation';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';

export const disputesService = {
  async listMine(params: { page?: number; limit?: number; status?: string } = {}) {
    const response = await apiClient<MarketplaceDispute[] | PaginatedResult<MarketplaceDispute>>(
      WEB_API_ROUTES.disputes.mine,
      {
        params: {
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 20),
          ...(params.status ? { status: params.status } : {}),
        },
      },
    );
    return normalizePaginated(response, { page: params.page ?? 1, limit: params.limit ?? 20 });
  },

  async getDetail(id: string): Promise<MarketplaceDispute> {
    const response = await apiClient<MarketplaceDispute>(WEB_API_ROUTES.disputes.detail(id));
    return response.data;
  },

  async create(input: CreateDisputeInput): Promise<MarketplaceDispute> {
    const response = await apiClient<MarketplaceDispute>(WEB_API_ROUTES.disputes.create, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  },

  async requestEvidenceUploadUrl(
    disputeId: string,
    file: Pick<File, 'type' | 'name'>,
    description?: string,
  ): Promise<AvatarUploadUrlResponse> {
    const response = await apiClient<AvatarUploadUrlResponse>(
      WEB_API_ROUTES.disputes.uploadEvidence,
      {
        method: 'POST',
        body: JSON.stringify({
          disputeId,
          contentType: file.type,
          fileName: file.name,
          description,
        }),
      },
    );
    return response.data;
  },

  async confirmEvidenceUpload(
    disputeId: string,
    filePath: string,
    description?: string,
  ) {
    return apiClient(WEB_API_ROUTES.disputes.uploadEvidence, {
      method: 'POST',
      body: JSON.stringify({ disputeId, filePath, description }),
    });
  },

  async uploadEvidenceFile(
    disputeId: string,
    file: File,
    description?: string,
  ): Promise<string> {
    const upload = await this.requestEvidenceUploadUrl(disputeId, file, description);
    await fetch(upload.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    await this.confirmEvidenceUpload(disputeId, upload.key, description);
    return upload.publicUrl;
  },

  async respond(input: {
    disputeId: string;
    messageText: string;
    file?: File;
    evidenceDescription?: string;
  }): Promise<MarketplaceDispute> {
    let filePath: string | undefined;
    if (input.file) {
      const upload = await this.requestEvidenceUploadUrl(
        input.disputeId,
        input.file,
        input.evidenceDescription,
      );
      await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: input.file,
        headers: { 'Content-Type': input.file.type },
      });
      filePath = upload.key;
    }

    const response = await apiClient<MarketplaceDispute>(WEB_API_ROUTES.disputes.respond, {
      method: 'POST',
      body: JSON.stringify({
        disputeId: input.disputeId,
        messageText: input.messageText,
        filePath,
        evidenceDescription: input.evidenceDescription,
      }),
    });
    return response.data;
  },
};
