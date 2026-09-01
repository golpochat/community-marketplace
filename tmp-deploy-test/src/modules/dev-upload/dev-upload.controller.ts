import {
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
    if (this.r2.isConfigured()) {
      throw new NotFoundException();
    }
    if (!key) {
      throw new NotFoundException();
    }

    const body =
      req.rawBody ??
      (Buffer.isBuffer(req.body) ? req.body : Buffer.from([]));
    await this.devUpload.save(key, body);
    return { ok: true };
  }

  @Get()
  async download(
    @Query('key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (this.r2.isConfigured()) {
      throw new NotFoundException();
    }
    if (!key) {
      throw new NotFoundException();
    }

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
      throw new NotFoundException();
    }
  }
}
