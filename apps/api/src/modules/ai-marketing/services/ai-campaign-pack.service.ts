import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AiMarketingTask } from '@community-marketplace/types';
import type { AiMarketingCampaignPackInput } from '@community-marketplace/validation';

import { extractStorageKeyFromUrl } from '../../../libs/asset-url.lib';
import { PrismaService } from '../../../database/prisma.service';
import { DevUploadService } from '../../dev-upload/dev-upload.service';
import { R2StorageService } from '../../users/services/r2-storage.service';
import { buildZipBuffer, type ZipEntry } from '../lib/zip-store.lib';
import { AiMarketingAccessService } from './ai-marketing-access.service';

const CAPTION_TASKS: AiMarketingTask[] = [
  'instagram_caption',
  'facebook_ad',
  'tiktok_script',
  'whatsapp_message',
  'email_campaign',
  'seasonal_promo',
  'keywords',
  'seo_title',
  'description',
];

const CAPTION_FILENAMES: Partial<Record<AiMarketingTask, string>> = {
  instagram_caption: 'captions/instagram.txt',
  facebook_ad: 'captions/facebook.txt',
  tiktok_script: 'captions/tiktok.txt',
  whatsapp_message: 'captions/whatsapp.txt',
  email_campaign: 'captions/email.txt',
  seasonal_promo: 'captions/seasonal.txt',
  keywords: 'captions/keywords.txt',
  seo_title: 'captions/seo-title.txt',
  description: 'captions/description.txt',
};

@Injectable()
export class AiCampaignPackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AiMarketingAccessService,
    private readonly r2: R2StorageService,
    private readonly devUpload: DevUploadService,
  ) {}

  async buildPack(
    userId: string,
    input: AiMarketingCampaignPackInput,
  ): Promise<{ buffer: Buffer; filename: string }> {
    await this.access.assertEffective();

    const listing = await this.prisma.listing.findFirst({
      where: { id: input.listingId, sellerId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        locationLabel: true,
        price: true,
        salePrice: true,
        currency: true,
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const logs = await this.prisma.aiGenerationLog.findMany({
      where: { userId, listingId: listing.id },
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: {
        task: true,
        outputText: true,
        inputSummary: true,
        createdAt: true,
      },
    });

    const captionByTask = new Map<AiMarketingTask, string>();
    const banners: Array<{ label: string; url: string }> = [];

    for (const log of logs) {
      if (
        CAPTION_TASKS.includes(log.task) &&
        !captionByTask.has(log.task) &&
        log.outputText.trim()
      ) {
        captionByTask.set(log.task, log.outputText.trim());
      }
      if (log.task === 'banner_creator' && banners.length < 6) {
        const format =
          /format=([a-z_]+)/.exec(log.inputSummary ?? '')?.[1] ??
          `banner-${banners.length + 1}`;
        banners.push({ label: format, url: log.outputText });
      }
    }

    const entries: ZipEntry[] = [];

    for (const [task, text] of captionByTask) {
      const path = CAPTION_FILENAMES[task];
      if (!path) continue;
      entries.push({ path, data: Buffer.from(`${text}\n`, 'utf8') });
    }

    let bannerIndex = 0;
    for (const banner of banners) {
      try {
        const buffer = await this.readMarketingBuffer(banner.url, userId);
        const safe = banner.label.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        bannerIndex += 1;
        entries.push({
          path: `banners/${String(bannerIndex).padStart(2, '0')}-${safe}.webp`,
          data: buffer,
        });
      } catch {
        // Skip missing/expired marketing files
      }
    }

    if (entries.length === 0) {
      throw new BadRequestException(
        'No AI captions or share banners found for this listing yet. Generate a caption or banner first, then download the pack.',
      );
    }

    const price = Number(listing.salePrice ?? listing.price);
    const priceLabel = Number.isFinite(price)
      ? `${listing.currency === 'EUR' ? '€' : `${listing.currency} `}${price}`
      : '';

    const readme = [
      'SellNearby campaign pack',
      '========================',
      '',
      `Listing: ${listing.title}`,
      listing.locationLabel ? `Location: ${listing.locationLabel}` : '',
      priceLabel ? `Price: ${priceLabel}` : '',
      '',
      'Contents',
      '- captions/  — latest AI copy for this listing',
      '- banners/   — latest share banners (marketing-only)',
      '',
      'Tips',
      '- Post in Europe/Dublin peak windows from Best posting time',
      '- Boost the listing on SellNearby after you share for more reach',
      '',
      'Advisory only — review copy before posting.',
      '',
    ]
      .filter(Boolean)
      .join('\n');

    entries.unshift({
      path: 'README.txt',
      data: Buffer.from(readme, 'utf8'),
    });

    const slug = listing.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    const filename = `sellnearby-campaign-${slug || listing.id.slice(0, 8)}.zip`;

    return {
      buffer: buildZipBuffer(entries),
      filename,
    };
  }

  private async readMarketingBuffer(
    storedUrl: string,
    userId: string,
  ): Promise<Buffer> {
    const key = extractStorageKeyFromUrl(storedUrl);
    if (!key || !key.startsWith(`system-assets/${userId}/marketing/`)) {
      throw new BadRequestException('Invalid marketing asset');
    }
    if (this.r2.isConfigured()) {
      return this.r2.getObjectBuffer(key);
    }
    const file = await this.devUpload.read(key);
    return file.buffer;
  }
}
