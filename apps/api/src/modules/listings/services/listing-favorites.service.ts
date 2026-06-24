import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Listing } from '@community-marketplace/types';
import { paginationSchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { ApiUtilsService } from '../../../utils/api-utils.service';
import { listingInclude, mapListing, mapListingSummary } from '../mappers/listing.mapper';
import { ListingVisibilityService } from './listing-visibility.service';

@Injectable()
export class ListingFavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUtils: ApiUtilsService,
    private readonly visibility: ListingVisibilityService,
  ) {}

  async add(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, sellerId: true },
    });
    if (!listing || listing.status !== 'active') {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    if (await this.visibility.isSellerRestricted(listing.sellerId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    try {
      await this.prisma.$transaction([
        this.prisma.listingFavorite.create({ data: { userId, listingId } }),
        this.prisma.listing.update({
          where: { id: listingId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ]);
    } catch {
      throw new ConflictException('Listing is already in favorites');
    }

    return { listingId, favorited: true };
  }

  async remove(userId: string, listingId: string) {
    const favorite = await this.prisma.listingFavorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.$transaction([
      this.prisma.listingFavorite.delete({
        where: { userId_listingId: { userId, listingId } },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: { favoriteCount: { decrement: 1 } },
      }),
    ]);

    return { listingId, favorited: false };
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });

    const [favorites, total] = await Promise.all([
      this.prisma.listingFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: { listing: { include: listingInclude } },
      }),
      this.prisma.listingFavorite.count({ where: { userId } }),
    ]);

    const data = favorites
      .filter((f) => f.listing.status === 'active')
      .map((f) => mapListingSummary(f.listing));

    return this.apiUtils.paginate(data, p, l, total);
  }
}
