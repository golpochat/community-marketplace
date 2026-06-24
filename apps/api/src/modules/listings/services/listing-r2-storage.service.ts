import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import type { ListingUploadUrlResponse } from '@community-marketplace/types';
import { listingImageUploadRequestSchema } from '@community-marketplace/validation';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

@Injectable()
export class ListingR2StorageService {
  private readonly accountId = process.env.R2_ACCOUNT_ID;
  private readonly accessKeyId = process.env.R2_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  private readonly bucket = process.env.R2_BUCKET ?? 'community-marketplace';
  private readonly publicBaseUrl =
    process.env.R2_PUBLIC_URL ?? 'https://assets.community.marketplace';

  isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey);
  }

  createListingImageUploadUrl(
    listingId: string,
    sellerId: string,
    input: unknown,
  ): ListingUploadUrlResponse {
    const parsed = listingImageUploadRequestSchema.parse(input);

    if (!ALLOWED_TYPES.has(parsed.contentType)) {
      throw new Error('Unsupported image type');
    }
    if (parsed.fileSizeBytes > MAX_FILE_BYTES) {
      throw new Error('Image exceeds maximum file size of 5MB');
    }

    const ext =
      parsed.fileName?.split('.').pop() ??
      parsed.contentType.split('/')[1] ??
      'jpg';
    const key = `listings/${sellerId}/${listingId}/${randomUUID()}.${ext}`;
    const publicUrl = this.buildPublicUrl(key);
    const optimizedUrl = this.buildOptimizedUrl(publicUrl);
    const expiresInSeconds = 900;

    if (!this.isConfigured()) {
      return {
        uploadUrl: `${process.env.WEB_APP_URL ?? 'http://localhost:3000'}/api/dev-upload?key=${encodeURIComponent(key)}`,
        publicUrl,
        key,
        expiresInSeconds,
        optimizedUrl,
      };
    }

    const uploadUrl = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${key}?X-Amz-Expires=${expiresInSeconds}`;

    return { uploadUrl, publicUrl, key, expiresInSeconds, optimizedUrl };
  }

  verifyListingImageKey(key: string, sellerId: string, listingId: string) {
    return key.startsWith(`listings/${sellerId}/${listingId}/`);
  }

  buildPublicUrl(key: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  buildOptimizedUrl(publicUrl: string): string {
    const separator = publicUrl.includes('?') ? '&' : '?';
    return `${publicUrl}${separator}format=webp&width=1200&quality=82`;
  }

  hashUploadKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  get maxImages(): number {
    return MAX_IMAGES;
  }
}
