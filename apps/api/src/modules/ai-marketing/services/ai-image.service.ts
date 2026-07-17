import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

import {
  AI_MARKETING_DAILY_GENERATION_LIMIT,
  AI_MARKETING_FREE_UNITS_MONTHLY,
  AI_MARKETING_IMAGE_PROMPT_VERSION,
  AI_MARKETING_TASK_UNIT_COSTS,
  AI_MARKETING_UNIT_EUR_COST,
  isSellerVerified,
  type AiBannerFormat,
  type AiBannerTemplate,
  type AiBillingMethod,
  type AiMarketingApplyImageResult,
  type AiMarketingImageResult,
  type AiMarketingTask,
  type SellerStatus,
} from '@community-marketplace/types';
import type {
  AiMarketingApplyImageInput,
  AiMarketingImageInput,
} from '@community-marketplace/validation';

import { extractStorageKeyFromUrl } from '../../../libs/asset-url.lib';
import { PrismaService } from '../../../database/prisma.service';
import { DevUploadService } from '../../dev-upload/dev-upload.service';
import { ListingImagesService } from '../../listings/services/listing-images.service';
import { R2StorageService } from '../../users/services/r2-storage.service';
import { AiCreditMeterService } from './ai-credit-meter.service';
import { AiMarketingAccessService } from './ai-marketing-access.service';

const BANNER_SIZES: Record<AiBannerFormat, { width: number; height: number }> = {
  feed_square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  marketplace_card: { width: 1200, height: 630 },
};

@Injectable()
export class AiImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meter: AiCreditMeterService,
    private readonly r2: R2StorageService,
    private readonly devUpload: DevUploadService,
    private readonly listingImages: ListingImagesService,
    private readonly access: AiMarketingAccessService,
  ) {}

  isBackgroundRemovalAvailable(): boolean {
    return Boolean(process.env.REMOVE_BG_API_KEY?.trim());
  }

  async process(
    userId: string,
    input: AiMarketingImageInput,
  ): Promise<AiMarketingImageResult> {
    await this.access.assertEffective();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sellerStatus: true },
    });
    if (!user) throw new ForbiddenException('User not found');

    const sellerVerified = isSellerVerified(user.sellerStatus as SellerStatus);
    const dailyUsed = await this.meter.countGenerationsToday(userId);
    if (dailyUsed >= AI_MARKETING_DAILY_GENERATION_LIMIT) {
      throw new ForbiddenException(
        `Daily AI generation limit reached (${AI_MARKETING_DAILY_GENERATION_LIMIT}). Try again tomorrow.`,
      );
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: input.listingId, sellerId: userId },
      select: {
        id: true,
        title: true,
        locationLabel: true,
        price: true,
        salePrice: true,
        currency: true,
        store: { select: { logoUrl: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const image = await this.prisma.listingImage.findFirst({
      where: { id: input.imageId, listingId: listing.id },
    });
    if (!image) throw new NotFoundException('Listing image not found');

    const creditUnits = AI_MARKETING_TASK_UNIT_COSTS[input.task];
    const { billingMethod, amountEur } = await this.resolveBilling(
      userId,
      sellerVerified,
      creditUnits,
    );

    const sourceBuffer = await this.readListingImageBuffer(image.url);
    const bannerTemplate = input.bannerTemplate ?? 'classic';
    const includeWatermark = input.includeWatermark !== false;
    const includeStoreLogo = Boolean(input.includeStoreLogo);
    let storeLogoBuffer: Buffer | null = null;
    if (
      includeStoreLogo &&
      input.task === 'banner_creator' &&
      listing.store.logoUrl
    ) {
      try {
        storeLogoBuffer = await this.readListingImageBuffer(listing.store.logoUrl);
      } catch {
        storeLogoBuffer = null;
      }
    }

    const processed = await this.runOperation({
      task: input.task,
      sourceBuffer,
      bannerFormat: input.bannerFormat,
      bannerTemplate,
      includeWatermark,
      storeLogoBuffer,
      title: listing.title,
      location: listing.locationLabel,
      priceLabel: this.formatPrice(
        Number(listing.salePrice ?? listing.price),
        listing.currency,
      ),
    });

    const storageKey = `system-assets/${userId}/marketing/${randomUUID()}.webp`;
    await this.writeOutput(storageKey, processed.buffer);
    const publicUrl = this.r2.buildPublicUrl(storageKey);

    const { generationId, walletBalance, freeUnitsRemaining } =
      await this.meter.recordGeneration({
        userId,
        listingId: listing.id,
        task: input.task,
        provider: processed.provider,
        model: processed.model,
        promptVersion: AI_MARKETING_IMAGE_PROMPT_VERSION,
        billingMethod,
        creditUnits,
        amountEur,
        inputSummary: `${input.task}|image=${input.imageId}|format=${input.bannerFormat ?? 'n/a'}|template=${bannerTemplate}|wm=${includeWatermark}|logo=${includeStoreLogo && Boolean(storeLogoBuffer)}`,
        outputText: publicUrl,
      });

    return {
      task: input.task,
      publicUrl,
      storageKey,
      bannerFormat: input.bannerFormat,
      bannerTemplate: input.task === 'banner_creator' ? bannerTemplate : undefined,
      billingMethod,
      creditUnits,
      amountEur,
      walletBalance,
      freeUnitsRemaining,
      provider: processed.provider,
      model: processed.model,
      generationId,
      mayApplyToListing:
        input.task === 'image_enhance' || input.task === 'image_bg_remove',
      note: processed.note,
    };
  }

  async applyToListing(
    userId: string,
    input: AiMarketingApplyImageInput,
  ): Promise<AiMarketingApplyImageResult> {
    await this.access.assertEffective();

    const log = await this.prisma.aiGenerationLog.findFirst({
      where: { id: input.generationId, userId },
    });
    if (!log) throw new NotFoundException('Generation not found');
    if (log.task !== 'image_enhance' && log.task !== 'image_bg_remove') {
      throw new BadRequestException(
        'Only enhanced or background-removed images can be applied to a listing.',
      );
    }
    if (!log.listingId) {
      throw new BadRequestException('This generation is not linked to a listing.');
    }

    const key = extractStorageKeyFromUrl(log.outputText);
    if (!key || !key.startsWith(`system-assets/${userId}/marketing/`)) {
      throw new BadRequestException('Invalid marketing export for this seller.');
    }

    const buffer = await this.readMarketingBuffer(key);
    const images = await this.listingImages.addImageFromBuffer(
      log.listingId,
      userId,
      buffer,
    );

    return {
      generationId: log.id,
      listingId: log.listingId,
      images,
    };
  }

  private async readMarketingBuffer(key: string): Promise<Buffer> {
    try {
      if (this.r2.isConfigured()) {
        return await this.r2.getObjectBuffer(key);
      }
      const file = await this.devUpload.read(key);
      return file.buffer;
    } catch {
      throw new NotFoundException('Marketing export file not found.');
    }
  }

  private async resolveBilling(
    userId: string,
    sellerVerified: boolean,
    creditUnits: number,
  ): Promise<{ billingMethod: AiBillingMethod; amountEur: number }> {
    const freeUsed = await this.meter.countFreeUnitsUsedThisMonth(userId);
    const freeRemaining = sellerVerified
      ? Math.max(0, AI_MARKETING_FREE_UNITS_MONTHLY - freeUsed)
      : 0;

    if (freeRemaining >= creditUnits) {
      return { billingMethod: 'free_quota', amountEur: 0 };
    }

    const amountEur = Number((creditUnits * AI_MARKETING_UNIT_EUR_COST).toFixed(2));
    const balance = await this.meter.getWalletBalance(userId);
    if (balance < amountEur) {
      if (!sellerVerified) {
        throw new ForbiddenException(
          'Free AI generations are for verified sellers. Complete verification or top up SellNearby Credit to continue.',
        );
      }
      throw new ForbiddenException(
        `Not enough SellNearby Credit. This generation costs €${amountEur.toFixed(2)}. Your balance is €${balance.toFixed(2)}.`,
      );
    }
    return { billingMethod: 'wallet', amountEur };
  }

  private async readListingImageBuffer(storedUrl: string): Promise<Buffer> {
    const key = extractStorageKeyFromUrl(storedUrl);
    if (key) {
      try {
        if (this.r2.isConfigured()) {
          return await this.r2.getObjectBuffer(key);
        }
        const file = await this.devUpload.read(key);
        return file.buffer;
      } catch {
        // Fall through to HTTP fetch
      }
    }

    try {
      const response = await fetch(storedUrl, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new BadRequestException('Could not load listing image for processing.');
      }
      return Buffer.from(await response.arrayBuffer());
    } catch {
      throw new BadRequestException('Could not load listing image for processing.');
    }
  }

  private async writeOutput(key: string, buffer: Buffer): Promise<void> {
    this.devUpload.assertValidKey(key);
    if (this.r2.isConfigured()) {
      await this.r2.putObject(key, buffer, 'image/webp');
      return;
    }
    await this.devUpload.save(key, buffer);
  }

  private async runOperation(input: {
    task: AiMarketingTask;
    sourceBuffer: Buffer;
    bannerFormat?: AiBannerFormat;
    bannerTemplate: AiBannerTemplate;
    includeWatermark: boolean;
    storeLogoBuffer: Buffer | null;
    title: string;
    location: string;
    priceLabel: string;
  }): Promise<{ buffer: Buffer; provider: string; model: string; note?: string }> {
    if (input.task === 'image_enhance') {
      const buffer = await this.enhance(input.sourceBuffer);
      return { buffer, provider: 'sharp', model: 'enhance-v1' };
    }

    if (input.task === 'image_bg_remove') {
      return this.removeBackground(input.sourceBuffer);
    }

    if (input.task === 'banner_creator') {
      if (!input.bannerFormat) {
        throw new BadRequestException('bannerFormat is required.');
      }
      const buffer = await this.createBanner({
        sourceBuffer: input.sourceBuffer,
        format: input.bannerFormat,
        template: input.bannerTemplate,
        includeWatermark: input.includeWatermark,
        storeLogoBuffer: input.storeLogoBuffer,
        title: input.title,
        location: input.location,
        priceLabel: input.priceLabel,
      });
      return {
        buffer,
        provider: 'sharp',
        model: `banner-${input.bannerFormat}-${input.bannerTemplate}`,
      };
    }

    throw new BadRequestException('Unsupported image task.');
  }

  private async enhance(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer, { failOn: 'none' })
      .rotate()
      .normalize()
      .modulate({ brightness: 1.05, saturation: 1.08 })
      .sharpen({ sigma: 0.8 })
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  }

  private async removeBackground(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; provider: string; model: string; note?: string }> {
    const apiKey = process.env.REMOVE_BG_API_KEY?.trim();
    if (apiKey) {
      const form = new FormData();
      form.append('size', 'auto');
      form.append('format', 'png');
      form.append(
        'image_file',
        new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }),
        'source.jpg',
      );

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey },
        body: form,
      });

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Background removal provider failed. Please try again shortly.',
        );
      }

      const png = Buffer.from(await response.arrayBuffer());
      const webp = await sharp(png)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .webp({ quality: 88 })
        .toBuffer();

      return { buffer: webp, provider: 'remove.bg', model: 'v1.0' };
    }

    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException(
        'Background removal is not configured. Set REMOVE_BG_API_KEY to enable it.',
      );
    }

    // Local/dev fallback: soft studio card (not true rembg).
    const resized = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    const meta = await sharp(resized).metadata();
    const width = meta.width ?? 1200;
    const height = meta.height ?? 1200;
    const canvasW = Math.max(width + 120, 1000);
    const canvasH = Math.max(height + 120, 1000);

    const composed = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 3,
        background: { r: 245, g: 247, b: 250 },
      },
    })
      .composite([
        {
          input: resized,
          left: Math.round((canvasW - width) / 2),
          top: Math.round((canvasH - height) / 2),
        },
      ])
      .webp({ quality: 85 })
      .toBuffer();

    return {
      buffer: composed,
      provider: 'sharp-studio-fallback',
      model: 'dev-stub',
      note: 'Dev fallback: studio card (not true background removal). Set REMOVE_BG_API_KEY for production rembg.',
    };
  }

  private async createBanner(input: {
    sourceBuffer: Buffer;
    format: AiBannerFormat;
    template: AiBannerTemplate;
    includeWatermark: boolean;
    storeLogoBuffer: Buffer | null;
    title: string;
    location: string;
    priceLabel: string;
  }): Promise<Buffer> {
    const { width, height } = BANNER_SIZES[input.format];
    const photo = await sharp(input.sourceBuffer, { failOn: 'none' })
      .rotate()
      .resize({ width, height, fit: 'cover', position: 'centre' })
      .toBuffer();

    const title = this.escapeXml(input.title).slice(0, 72);
    const location = this.escapeXml(input.location).slice(0, 48);
    const price = this.escapeXml(input.priceLabel);
    const headline = this.escapeXml(this.templateHeadline(input.template, input.location));
    const overlayHeight = Math.round(height * (input.format === 'story' ? 0.32 : 0.3));
    const titleSize = input.format === 'story' ? 48 : 36;
    const accent = this.templateAccent(input.template);

    const overlay = Buffer.from(`
      <svg width="${width}" height="${overlayHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(15,23,42,0)"/>
            <stop offset="100%" stop-color="rgba(15,23,42,0.9)"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <rect x="48" y="24" width="12" height="44" rx="4" fill="${accent}"/>
        <text x="72" y="54" fill="${accent}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${headline}</text>
        <text x="48" y="${overlayHeight - 96}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700">${title}</text>
        <text x="48" y="${overlayHeight - 52}" fill="#ccfbf1" font-family="Arial, sans-serif" font-size="28" font-weight="600">${price}</text>
        <text x="48" y="${overlayHeight - 18}" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="22">${location}</text>
      </svg>
    `);

    const layers: sharp.OverlayOptions[] = [
      { input: overlay, top: height - overlayHeight, left: 0 },
    ];

    if (input.storeLogoBuffer) {
      const logoSize = input.format === 'story' ? 120 : 96;
      const logo = await sharp(input.storeLogoBuffer, { failOn: 'none' })
        .rotate()
        .resize({
          width: logoSize,
          height: logoSize,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      const meta = await sharp(logo).metadata();
      const logoW = meta.width ?? logoSize;
      const logoH = meta.height ?? logoSize;
      const pad = Buffer.from(`
        <svg width="${logoW + 24}" height="${logoH + 24}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" rx="14" fill="rgba(255,255,255,0.92)"/>
        </svg>
      `);
      const badge = await sharp(pad)
        .composite([{ input: logo, left: 12, top: 12 }])
        .png()
        .toBuffer();
      layers.push({ input: badge, top: 28, left: 28 });
    }

    if (input.includeWatermark) {
      const wm = Buffer.from(`
        <svg width="280" height="48" xmlns="http://www.w3.org/2000/svg">
          <rect width="280" height="48" rx="10" fill="rgba(15,23,42,0.55)"/>
          <text x="20" y="31" fill="#ffffff" font-family="Arial, sans-serif" font-size="22" font-weight="700">SellNearby</text>
        </svg>
      `);
      layers.push({ input: wm, top: 28, left: width - 308 });
    }

    return sharp(photo).composite(layers).webp({ quality: 86 }).toBuffer();
  }

  private templateHeadline(template: AiBannerTemplate, location: string): string {
    switch (template) {
      case 'for_sale_near_you':
        return location ? `For sale near ${location}` : 'For sale near you';
      case 'collection_only':
        return 'Collection only';
      case 'priced_to_sell':
        return 'Priced to sell';
      case 'classic':
      default:
        return 'Listed on SellNearby';
    }
  }

  private templateAccent(template: AiBannerTemplate): string {
    switch (template) {
      case 'for_sale_near_you':
        return '#5eead4';
      case 'collection_only':
        return '#fbbf24';
      case 'priced_to_sell':
        return '#fb7185';
      case 'classic':
      default:
        return '#99f6e4';
    }
  }

  private formatPrice(amount: number, currency: string): string {
    if (!Number.isFinite(amount)) return '';
    const symbol = currency === 'EUR' || !currency ? '€' : `${currency} `;
    return `${symbol}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
