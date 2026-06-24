import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import type { AvatarUploadUrlResponse } from '@community-marketplace/types';

@Injectable()
export class R2StorageService {
  private readonly accountId = process.env.R2_ACCOUNT_ID;
  private readonly accessKeyId = process.env.R2_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  private readonly bucket = process.env.R2_BUCKET ?? 'community-marketplace';
  private readonly publicBaseUrl =
    process.env.R2_PUBLIC_URL ?? 'https://assets.community.marketplace';

  isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey);
  }

  createAvatarUploadUrl(
    userId: string,
    contentType: string,
    fileName?: string,
  ): AvatarUploadUrlResponse {
    const ext = fileName?.split('.').pop() ?? contentType.split('/')[1] ?? 'jpg';
    const key = `avatars/${userId}/${randomUUID()}.${ext}`;
    const publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;

    if (!this.isConfigured()) {
      return {
        uploadUrl: `${process.env.WEB_APP_URL ?? 'http://localhost:3000'}/api/dev-upload?key=${encodeURIComponent(key)}`,
        publicUrl,
        key,
        expiresInSeconds: 900,
      };
    }

    const expiresInSeconds = 900;
    const uploadUrl = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${key}?X-Amz-Expires=${expiresInSeconds}`;

    return {
      uploadUrl,
      publicUrl,
      key,
      expiresInSeconds,
    };
  }

  verifyKeyBelongsToUser(key: string, userId: string): boolean {
    return key.startsWith(`avatars/${userId}/`);
  }

  hashUploadKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
