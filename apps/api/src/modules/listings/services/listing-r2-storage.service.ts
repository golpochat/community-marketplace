import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import type { ListingUploadUrlResponse } from '@community-marketplace/types';
import { listingImageUploadRequestSchema } from '@community-marketplace/validation';

import { R2StorageService } from '../../users/services/r2-storage.service';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

@Injectable()
export class ListingR2StorageService {
  constructor(private readonly r2: R2StorageService) {}

  isConfigured(): boolean {
    return this.r2.isConfigured();
  }

  async createListingImageUploadUrl(
    listingId: string,
    sellerId: string,
    input: unknown,
  ): Promise<ListingUploadUrlResponse> {
    const parsed = listingImageUploadRequestSchema.parse(input);

    if (!ALLOWED_TYPES.has(parsed.contentType)) {
      throw new Error('Unsupported image type');
    }
    if (parsed.fileSizeBytes > MAX_FILE_BYTES) {
      throw new Error('Image exceeds maximum file size of 5MB');
    }

    const signed = await this.r2.createSignedUploadUrl({
      category: 'listing-images',
      ownerId: `${sellerId}/${listingId}`,
      contentType: parsed.contentType,
      fileName: parsed.fileName,
    });

    const publicUrl = this.buildPublicUrl(signed.key);
    return {
      ...signed,
      publicUrl,
      optimizedUrl: this.buildOptimizedUrl(publicUrl),
    };
  }

  verifyListingImageKey(key: string, sellerId: string, listingId: string) {
    return (
      key.startsWith(`listing-images/${sellerId}/${listingId}/`) ||
      key.startsWith(`listings/${sellerId}/${listingId}/`)
    );
  }

  buildPublicUrl(key: string): string {
    const base = process.env.R2_PUBLIC_URL ?? 'https://assets.community.marketplace';
    return `${base.replace(/\/$/, '')}/${key}`;
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
