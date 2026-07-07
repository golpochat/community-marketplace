import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import type { ChatAttachmentUploadResponse } from '@community-marketplace/types';
import { chatAttachmentUploadSchema } from '@community-marketplace/validation';

import { R2StorageService } from '../../users/services/r2-storage.service';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ChatR2StorageService {
  constructor(private readonly r2: R2StorageService) {}

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
    const expiresInSeconds = 900;

    return {
      uploadUrl: this.r2.devUploadUrl(key),
      publicUrl: this.r2.buildPublicUrl(key),
      key,
      expiresInSeconds,
    };
  }

  verifyAttachmentKey(key: string, threadId: string, userId: string) {
    return key.startsWith(`chat/${threadId}/${userId}/`);
  }

  hashUploadKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
