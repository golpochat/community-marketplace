import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import type { ChatAttachmentUploadResponse } from '@community-marketplace/types';
import { chatAttachmentUploadSchema } from '@community-marketplace/validation';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ChatR2StorageService {
  private readonly accountId = process.env.R2_ACCOUNT_ID;
  private readonly accessKeyId = process.env.R2_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  private readonly bucket = process.env.R2_BUCKET ?? 'community-marketplace';
  private readonly publicBaseUrl =
    process.env.R2_PUBLIC_URL ?? 'https://assets.community.marketplace';

  createAttachmentUploadUrl(
    threadId: string,
    userId: string,
    input: unknown,
  ): ChatAttachmentUploadResponse {
    const parsed = chatAttachmentUploadSchema.parse(input);

    if (!ALLOWED_TYPES.has(parsed.contentType)) {
      throw new Error('Unsupported image type');
    }
    if (parsed.fileSizeBytes > MAX_FILE_BYTES) {
      throw new Error('Attachment exceeds maximum file size of 5MB');
    }

    const ext =
      parsed.fileName?.split('.').pop() ??
      parsed.contentType.split('/')[1] ??
      'jpg';
    const key = `chat/${threadId}/${userId}/${randomUUID()}.${ext}`;
    const publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    const expiresInSeconds = 900;

    if (!this.isConfigured()) {
      return {
        uploadUrl: `${process.env.WEB_APP_URL ?? 'http://localhost:3000'}/api/dev-upload?key=${encodeURIComponent(key)}`,
        publicUrl,
        key,
        expiresInSeconds,
      };
    }

    const uploadUrl = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${key}?X-Amz-Expires=${expiresInSeconds}`;

    return { uploadUrl, publicUrl, key, expiresInSeconds };
  }

  verifyAttachmentKey(key: string, threadId: string, userId: string) {
    return key.startsWith(`chat/${threadId}/${userId}/`);
  }

  hashUploadKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey);
  }
}
