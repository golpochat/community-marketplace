import { Injectable, Logger } from '@nestjs/common';
import path from 'node:path';
import sharp from 'sharp';

import { DevUploadService } from '../../dev-upload/dev-upload.service';
import { R2StorageService } from '../../users/services/r2-storage.service';

const ASPECT_WIDTH = 16;
const ASPECT_HEIGHT = 9;
const JPEG_QUALITY = 82;

export interface ProcessedListingImage {
  key: string;
  publicUrl: string;
}

@Injectable()
export class ListingImageProcessorService {
  private readonly logger = new Logger(ListingImageProcessorService.name);

  constructor(
    private readonly r2: R2StorageService,
    private readonly devUpload: DevUploadService,
  ) {}

  async processListingImage(key: string): Promise<ProcessedListingImage> {
    const source = await this.readSource(key);
    const processed = await this.renderVariants(source.buffer);

    const keys = this.variantKeys(key);
    await Promise.all([
      this.writeOutput(keys.full, processed.full, 'image/webp'),
      this.writeOutput(keys.card, processed.card, 'image/webp'),
      this.writeOutput(keys.thumb, processed.thumb, 'image/webp'),
      this.writeOutput(keys.tiny, processed.tiny, 'image/webp'),
    ]);

    return {
      key: keys.full,
      publicUrl: this.r2.buildPublicUrl(keys.full),
    };
  }

  private async readSource(key: string): Promise<{ buffer: Buffer }> {
    if (this.r2.isConfigured()) {
      return { buffer: await this.r2.getObjectBuffer(key) };
    }

    const file = await this.devUpload.read(key);
    return { buffer: file.buffer };
  }

  private async writeOutput(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (this.r2.isConfigured()) {
      await this.r2.putObject(key, buffer, contentType);
      return;
    }

    await this.devUpload.save(key, buffer);
  }

  private variantKeys(key: string) {
    const parsed = path.posix.parse(key.replace(/\\/g, '/'));
    const base = path.posix.join(parsed.dir, parsed.name);
    return {
      full: `${base}.webp`,
      card: `${base}-card.webp`,
      thumb: `${base}-thumb.webp`,
      tiny: `${base}-tiny.webp`,
    };
  }

  private toWebpKey(key: string): string {
    return this.variantKeys(key).full;
  }

  private async renderVariants(buffer: Buffer) {
    const base = sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({
        width: 1600,
        height: Math.round((1600 * ASPECT_HEIGHT) / ASPECT_WIDTH),
        fit: 'cover',
        position: 'centre',
      })
      .webp({ quality: JPEG_QUALITY });

    const full = await base.toBuffer();

    const card = await sharp(full)
      .resize({
        width: 800,
        height: Math.round((800 * ASPECT_HEIGHT) / ASPECT_WIDTH),
        fit: 'cover',
        position: 'centre',
      })
      .webp({ quality: JPEG_QUALITY })
      .toBuffer();

    const thumb = await sharp(full)
      .resize({
        width: 400,
        height: Math.round((400 * ASPECT_HEIGHT) / ASPECT_WIDTH),
        fit: 'cover',
        position: 'centre',
      })
      .webp({ quality: 78 })
      .toBuffer();

    const tiny = await sharp(full)
      .resize({ width: 200, height: 200, fit: 'cover', position: 'centre' })
      .webp({ quality: 76 })
      .toBuffer();

    this.logger.debug(
      `Processed image variants full=${full.length}B card=${card.length}B thumb=${thumb.length}B tiny=${tiny.length}B`,
    );

    return { full, card, thumb, tiny };
  }
}
