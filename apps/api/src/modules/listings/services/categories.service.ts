import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type { Category } from '@community-marketplace/types';
import {
  createCategorySchema,
  updateCategoryFlagsSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { mapCategory } from '../mappers/listing.mapper';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /** Public picker / browse — active and not hidden. */
  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true, isHidden: false },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapCategory);
  }

  /** Admin list — includes hidden and inactive. */
  async findAllForAdmin(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return rows.map(mapCategory);
  }

  async findById(id: string): Promise<Category> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row || !row.isActive || row.isHidden) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return mapCategory(row);
  }

  async findBySlug(slug: string): Promise<Category> {
    const row = await this.prisma.category.findUnique({ where: { slug } });
    if (!row || !row.isActive || row.isHidden) {
      throw new NotFoundException(`Category ${slug} not found`);
    }
    return mapCategory(row);
  }

  /**
   * Validate a category can be assigned on create/update.
   * Hidden / inactive categories cannot be selected for new listings.
   */
  async assertAssignable(categoryId: string): Promise<Category> {
    const row = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!row || !row.isActive) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
    if (row.isHidden) {
      throw new BadRequestException(
        'This category is not available for new listings. Choose another category.',
      );
    }
    return mapCategory(row);
  }

  /** Soft-review reason when category requiresReview is set. */
  requiresReviewReason(category: Pick<Category, 'name' | 'requiresReview'>): string | null {
    if (!category.requiresReview) return null;
    return `Category requires review: ${category.name}`;
  }

  async create(input: unknown): Promise<Category> {
    const parsed = createCategorySchema.parse(input);
    const slug =
      parsed.slug ??
      parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const row = await this.prisma.category.create({
      data: {
        name: parsed.name,
        slug,
        icon: parsed.icon,
        description: parsed.description,
        parentId: parsed.parentId,
        requiresReview: parsed.requiresReview ?? false,
        isHidden: parsed.isHidden ?? false,
      },
    });

    this.eventBus.publish({
      type: 'category.created',
      payload: { categoryId: row.id },
      timestamp: new Date(),
    });

    return mapCategory(row);
  }

  async updateFlags(categoryId: string, input: unknown): Promise<Category> {
    const parsed = updateCategoryFlagsSchema.parse(input);
    const existing = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const row = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(parsed.requiresReview !== undefined
          ? { requiresReview: parsed.requiresReview }
          : {}),
        ...(parsed.isHidden !== undefined ? { isHidden: parsed.isHidden } : {}),
        ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
      },
    });

    this.eventBus.publish({
      type: 'category.updated',
      payload: { categoryId: row.id },
      timestamp: new Date(),
    });

    return mapCategory(row);
  }
}
