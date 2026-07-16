import { Injectable, NotFoundException } from '@nestjs/common';

import type { AiMarketingGenerateInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';

export interface AiListingContext {
  listingId?: string;
  title: string;
  description: string;
  categoryName: string;
  condition: string;
  location: string;
  priceLabel: string;
  storeName?: string;
}

@Injectable()
export class AiContextAssemblerService {
  constructor(private readonly prisma: PrismaService) {}

  async assemble(
    userId: string,
    input: AiMarketingGenerateInput,
  ): Promise<AiListingContext> {
    if (input.listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: { id: input.listingId, sellerId: userId },
        include: {
          category: { select: { name: true } },
          store: { select: { name: true } },
        },
      });
      if (!listing) {
        throw new NotFoundException('Listing not found');
      }

      const price = Number(listing.salePrice ?? listing.price);
      return {
        listingId: listing.id,
        title: input.title?.trim() || listing.title,
        description: input.description?.trim() || listing.description,
        categoryName: listing.category.name,
        condition: listing.condition,
        location: listing.locationLabel,
        priceLabel: Number.isFinite(price) ? `€${price.toFixed(2)}` : '',
        storeName: listing.store.name,
      };
    }

    const categoryName = input.categoryName?.trim() || 'General';
    const priceRaw = input.price;
    let priceLabel = '';
    if (priceRaw !== undefined && priceRaw !== '') {
      const n = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw);
      if (Number.isFinite(n)) priceLabel = `€${n.toFixed(2)}`;
    }

    return {
      title: input.title?.trim() || '',
      description: input.description?.trim() || '',
      categoryName,
      condition: input.condition?.trim() || 'good',
      location: input.location?.trim() || 'Ireland',
      priceLabel,
    };
  }

  summarize(context: AiListingContext): string {
    return [
      context.title && `title=${context.title}`,
      context.categoryName && `category=${context.categoryName}`,
      context.condition && `condition=${context.condition}`,
      context.location && `location=${context.location}`,
      context.priceLabel && `price=${context.priceLabel}`,
      context.storeName && `store=${context.storeName}`,
    ]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 500);
  }
}
