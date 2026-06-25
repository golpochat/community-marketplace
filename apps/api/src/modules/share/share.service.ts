import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ShareAnalyticsSummary, SharePlatform, ShortLinkResult } from '@community-marketplace/types';
import {
  shortenListingLinkSchema,
  trackListingShareSchema,
} from '@community-marketplace/validation';
import { generateShareText, generateShortCode, getShortLinkUrl } from '@community-marketplace/utils';

import { PrismaService } from '../../database/prisma.service';
import { listingDeliveryInclude, mapListingDeliverySelection } from '../listings/mappers/delivery.mapper';

@Injectable()
export class ShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getAppUrl(): string {
    return (this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async shorten(input: unknown): Promise<ShortLinkResult> {
    const { listingId } = shortenListingLinkSchema.parse(input);
    const listing = await this.getActiveListing(listingId);

    const existing = await this.prisma.shortLink.findFirst({
      where: { listingId },
      orderBy: { createdAt: 'asc' },
    });

    const shortCode = existing?.shortCode ?? (await this.createUniqueShortCode(listingId));
    const shortUrl = getShortLinkUrl(shortCode, this.getAppUrl());

    const deliveryRows = await this.prisma.listingDeliveryOption.findMany({
      where: { listingId },
      include: listingDeliveryInclude,
    });

    const shareText = generateShareText(
      {
        title: listing.title,
        price: Number(listing.price),
        salePrice: listing.salePrice != null ? Number(listing.salePrice) : undefined,
        originalPrice: listing.originalPrice != null ? Number(listing.originalPrice) : undefined,
        location: { label: listing.locationLabel },
        deliveryOptions: deliveryRows.map(mapListingDeliverySelection),
      },
      shortUrl,
    );

    return { shortCode, shortUrl, shareText, listingId };
  }

  async track(input: unknown): Promise<{ recorded: boolean }> {
    const { listingId, platform } = trackListingShareSchema.parse(input);
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: 'active' },
      select: { id: true, sellerId: true },
    });
    if (!listing) return { recorded: false };

    await this.prisma.listingShare.create({
      data: {
        listingId,
        sellerId: listing.sellerId,
        platform: platform as SharePlatform,
      },
    });

    return { recorded: true };
  }

  async resolveAndClick(shortCode: string): Promise<{ listingId: string }> {
    const link = await this.prisma.shortLink.findUnique({ where: { shortCode } });
    if (!link) throw new NotFoundException('Short link not found');

    await this.prisma.shortLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    return { listingId: link.listingId };
  }

  async getSellerShareAnalytics(sellerId: string): Promise<ShareAnalyticsSummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [shares, shortLinks, listings] = await Promise.all([
      this.prisma.listingShare.findMany({
        where: { sellerId, createdAt: { gte: thirtyDaysAgo } },
        select: { platform: true, createdAt: true, listingId: true },
      }),
      this.prisma.shortLink.findMany({
        where: { listing: { sellerId } },
        select: { listingId: true, clickCount: true },
      }),
      this.prisma.listing.findMany({
        where: { sellerId },
        select: { id: true, title: true },
      }),
    ]);

    const totalShares = shares.length;
    const totalClicks = shortLinks.reduce((sum: number, link: { clickCount: number }) => sum + link.clickCount, 0);
    const clickThroughRate =
      totalShares > 0 ? Math.round((totalClicks / totalShares) * 1000) / 10 : 0;

    const platformCounts = new Map<string, number>();
    for (const share of shares) {
      platformCounts.set(share.platform, (platformCounts.get(share.platform) ?? 0) + 1);
    }

    const dayCounts = new Map<string, number>();
    for (const share of shares) {
      const day = share.createdAt.toISOString().slice(0, 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }

    const sharesByListing = new Map<string, number>();
    for (const share of shares) {
      sharesByListing.set(share.listingId, (sharesByListing.get(share.listingId) ?? 0) + 1);
    }

    const clicksByListing = new Map<string, number>();
    for (const link of shortLinks) {
      clicksByListing.set(link.listingId, link.clickCount);
    }

    const titleById = new Map(listings.map((l: { id: string; title: string }) => [l.id, l.title]));

    const topListings = [...sharesByListing.entries()]
      .map(([listingId, shareCount]) => {
        const clickCount = clicksByListing.get(listingId) ?? 0;
        return {
          listingId,
          title: titleById.get(listingId) ?? listingId,
          shareCount,
          clickCount,
          clickThroughRate:
            shareCount > 0 ? Math.round((clickCount / shareCount) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.shareCount - a.shareCount)
      .slice(0, 10);

    return {
      totalShares,
      totalClicks,
      clickThroughRate,
      sharesByPlatform: [...platformCounts.entries()]
        .map(([platform, count]) => ({ platform: platform as SharePlatform, count }))
        .sort((a, b) => b.count - a.count),
      sharesOverTime: [...dayCounts.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topListings,
    };
  }

  private async getActiveListing(listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: 'active' },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  private async createUniqueShortCode(listingId: string): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const shortCode = generateShortCode(7);
      const exists = await this.prisma.shortLink.findUnique({ where: { shortCode } });
      if (!exists) {
        await this.prisma.shortLink.create({
          data: { listingId, shortCode },
        });
        return shortCode;
      }
    }
    throw new Error('Failed to generate unique short code');
  }
}
