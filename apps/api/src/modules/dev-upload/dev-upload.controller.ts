import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { toProcessedWebpKey } from '../../libs/asset-url.lib';
import { R2StorageService } from '../users/services/r2-storage.service';
import { DevUploadService } from './dev-upload.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Public()
@Controller('dev-upload')
export class DevUploadController {
  constructor(
    private readonly devUpload: DevUploadService,
    private readonly r2: R2StorageService,
  ) {}

  @Put()
  async upload(@Query('key') key: string | undefined, @Req() req: RawBodyRequest) {
    if (!key) {
      throw new NotFoundException();
    }

    const body =
      req.rawBody ??
      (Buffer.isBuffer(req.body) ? req.body : Buffer.from([]));
    if (!body.length) {
      throw new BadRequestException('Empty upload body');
    }

    const safeKey = this.devUpload.assertValidKey(key);

    if (this.r2.isConfigured()) {
      const contentType =
        typeof req.headers['content-type'] === 'string'
          ? req.headers['content-type']
          : 'application/octet-stream';
      await this.r2.putObject(safeKey, body, contentType);
      return { ok: true };
    }

    await this.devUpload.save(safeKey, body);
    return { ok: true };
  }

  @Get()
  async download(
    @Query('key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!key) {
      throw new NotFoundException();
    }

    // Legacy local uploads (pre-R2) remain readable after R2 is enabled.
    try {
      const file = await this.devUpload.read(key);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader(
        'Cache-Control',
        process.env.NODE_ENV === 'development'
          ? 'no-store'
          : 'public, max-age=31536000, immutable',
      );
      return new StreamableFile(file.buffer);
    } catch {
      if (!this.r2.isConfigured()) {
        throw new NotFoundException();
      }

      const candidates = Array.from(
        new Set([key, toProcessedWebpKey(key)]),
      );
      for (const candidate of candidates) {
        try {
          const buffer = await this.r2.getObjectBuffer(candidate);
          res.setHeader(
            'Content-Type',
            candidate.endsWith('.webp') ? 'image/webp' : 'application/octet-stream',
          );
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return new StreamableFile(buffer);
        } catch {
          // try next candidate key
        }
      }

      throw new NotFoundException();
    }
  }
}
