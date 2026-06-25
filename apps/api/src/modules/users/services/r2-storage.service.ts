import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'node:crypto';

import type { AvatarUploadUrlResponse } from '@community-marketplace/types';

import { buildDevUploadUrl, isR2Configured } from '../../../libs/asset-url.lib';

export type R2AssetCategory =
  | 'user-avatars'
  | 'listing-images'
  | 'verification-documents'
  | 'system-assets';

const CATEGORY_PREFIX: Record<R2AssetCategory, string> = {
  'user-avatars': 'user-avatars',
  'listing-images': 'listing-images',
  'verification-documents': 'verification-documents',
  'system-assets': 'system-assets',
};

@Injectable()
export class R2StorageService {
  private readonly accountId = process.env.R2_ACCOUNT_ID;
  private readonly accessKeyId = process.env.R2_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  private readonly bucket = process.env.R2_BUCKET ?? 'community-marketplace';
  private readonly publicBaseUrl =
    process.env.R2_PUBLIC_URL ?? 'https://assets.community.marketplace';
  private readonly endpoint =
    process.env.R2_ENDPOINT ??
    (this.accountId ? `https://${this.accountId}.r2.cloudflarestorage.com` : undefined);
  private client: S3Client | null = null;

  isConfigured(): boolean {
    return isR2Configured();
  }

  private getClient(): S3Client {
    if (!this.client) {
      if (!this.isConfigured()) {
        throw new Error('R2 storage is not configured');
      }
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: this.accessKeyId!,
          secretAccessKey: this.secretAccessKey!,
        },
      });
    }
    return this.client;
  }

  buildKey(category: R2AssetCategory, ownerId: string, fileName?: string, contentType?: string) {
    const ext =
      fileName?.split('.').pop() ??
      contentType?.split('/')[1]?.replace('jpeg', 'jpg') ??
      'bin';
    const prefix = CATEGORY_PREFIX[category];
    return `${prefix}/${ownerId}/${randomUUID()}.${ext}`;
  }

  devUploadUrl(key: string): string {
    return buildDevUploadUrl(key);
  }

  buildPublicUrl(key: string): string {
    if (!this.isConfigured()) {
      return this.devUploadUrl(key);
    }
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  async createSignedUploadUrl(input: {
    category: R2AssetCategory;
    ownerId: string;
    contentType: string;
    fileName?: string;
    expiresInSeconds?: number;
  }): Promise<AvatarUploadUrlResponse> {
    const key = this.buildKey(input.category, input.ownerId, input.fileName, input.contentType);
    const expiresInSeconds = input.expiresInSeconds ?? 900;

    if (!this.isConfigured()) {
      return {
        uploadUrl: this.devUploadUrl(key),
        publicUrl: this.buildPublicUrl(key),
        key,
        expiresInSeconds,
      };
    }

    const publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn: expiresInSeconds });

    return { uploadUrl, publicUrl, key, expiresInSeconds };
  }

  async createAvatarUploadUrl(
    userId: string,
    contentType: string,
    fileName?: string,
  ): Promise<AvatarUploadUrlResponse> {
    return this.createSignedUploadUrl({
      category: 'user-avatars',
      ownerId: userId,
      contentType,
      fileName,
    });
  }

  async createVerificationDocumentUploadUrl(
    userId: string,
    contentType: string,
    fileName?: string,
  ): Promise<AvatarUploadUrlResponse> {
    return this.createSignedUploadUrl({
      category: 'verification-documents',
      ownerId: userId,
      contentType,
      fileName,
    });
  }

  verifyKeyBelongsToUser(key: string, userId: string): boolean {
    return (
      key.startsWith(`user-avatars/${userId}/`) || key.startsWith(`avatars/${userId}/`)
    );
  }

  verifyKeyCategory(key: string, category: R2AssetCategory, ownerId: string): boolean {
    return key.startsWith(`${CATEGORY_PREFIX[category]}/${ownerId}/`);
  }

  hashUploadKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async createSignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    if (!this.isConfigured()) {
      return this.buildPublicUrl(key);
    }
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.getClient(), command, { expiresIn: expiresInSeconds });
  }
}
