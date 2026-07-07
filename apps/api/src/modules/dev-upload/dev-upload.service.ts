import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_KEY_PREFIXES = [
  'listing-images/',
  'listings/',
  'user-avatars/',
  'avatars/',
  'store-banners/',
  'verification-documents/',
  'dispute-evidence/',
  'system-assets/',
  'payment-receipts/',
  'platform-invoices/',
  'chat-attachments/',
  'chat/',
] as const;

@Injectable()
export class DevUploadService {
  private readonly uploadRoot = path.join(process.cwd(), '.data', 'uploads');

  assertValidKey(key: string): string {
    const normalized = key.replace(/\\/g, '/').trim();
    if (!normalized || normalized.includes('..')) {
      throw new BadRequestException('Invalid upload key');
    }
    if (!ALLOWED_KEY_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      throw new BadRequestException('Invalid upload key prefix');
    }
    return normalized;
  }

  private resolveFilePath(key: string): string {
    const safeKey = this.assertValidKey(key);
    const resolved = path.resolve(this.uploadRoot, safeKey);
    if (!resolved.startsWith(path.resolve(this.uploadRoot))) {
      throw new BadRequestException('Invalid upload key path');
    }
    return resolved;
  }

  async save(key: string, body: Buffer): Promise<void> {
    if (!body.length) {
      throw new BadRequestException('Empty upload body');
    }
    const filePath = this.resolveFilePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body);
  }

  async read(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    const filePath = this.resolveFilePath(key);
    const buffer = await readFile(filePath);
    return { buffer, contentType: this.contentTypeFromKey(key) };
  }

  private contentTypeFromKey(key: string): string {
    const ext = path.extname(key).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.pdf':
        return 'application/pdf';
      case '.html':
        return 'text/html; charset=utf-8';
      default:
        return 'application/octet-stream';
    }
  }
}
