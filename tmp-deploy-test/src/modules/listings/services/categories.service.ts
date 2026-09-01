import { Injectable, NotFoundException } from '@nestjs/common';

import type { Category } from '@community-marketplace/types';
import { createCategorySchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { mapCategory } from '../mappers/listing.mapper';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapCategory);
  }

  async findById(id: string): Promise<Category> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row || !row.isActive) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return mapCategory(row);
  }

  async findBySlug(slug: string): Promise<Category> {
    const row = await this.prisma.category.findUnique({ where: { slug } });
    if (!row || !row.isActive) {
      throw new NotFoundException(`Category ${slug} not found`);
    }
    return mapCategory(row);
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
      },
    });

    this.eventBus.publish({
      type: 'category.created',
      payload: { categoryId: row.id },
      timestamp: new Date(),
    });

    return mapCategory(row);
  }
}
