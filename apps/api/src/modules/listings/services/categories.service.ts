import { Injectable, NotFoundException } from '@nestjs/common';

import { slugify } from '@community-marketplace/utils';

import { CategoryEntity } from '../entities/category.entity';
import type { CreateCategoryDto } from '../dto/listings.dto';

@Injectable()
export class CategoriesService {
  private readonly categories = new Map<string, CategoryEntity>();

  constructor() {
    this.seed('Electronics', 'electronics');
    this.seed('Furniture', 'furniture');
    this.seed('Sports', 'sports');
  }

  findAll(): CategoryEntity[] {
    return [...this.categories.values()].filter((c) => c.isActive);
  }

  findById(id: string): CategoryEntity {
    const category = this.categories.get(id);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  create(dto: CreateCategoryDto): CategoryEntity {
    const category = new CategoryEntity();
    category.id = `cat-${Date.now()}`;
    category.name = dto.name;
    category.slug = slugify(dto.name);
    category.description = dto.description;
    category.parentId = dto.parentId;
    category.isActive = true;
    category.createdAt = new Date();
    category.updatedAt = new Date();
    this.categories.set(category.id, category);
    return category;
  }

  private seed(name: string, slug: string) {
    const category = new CategoryEntity();
    category.id = `cat-${slug}`;
    category.name = name;
    category.slug = slug;
    category.isActive = true;
    category.createdAt = new Date();
    category.updatedAt = new Date();
    this.categories.set(category.id, category);
  }
}
