import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  MonetizationProduct,
  MonetizationProductType,
} from '@community-marketplace/types';
import type {
  MonetizationProductUpsertInput,
  MonetizationProductUpdateInput,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { mapMonetizationProduct } from '../mappers/monetization-product.mapper';

@Injectable()
export class MonetizationProductService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmin(type?: MonetizationProductType): Promise<MonetizationProduct[]> {
    const rows = await this.prisma.monetizationProduct.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(mapMonetizationProduct);
  }

  async listPublished(type: MonetizationProductType): Promise<MonetizationProduct[]> {
    const rows = await this.prisma.monetizationProduct.findMany({
      where: { type, status: 'published' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(mapMonetizationProduct);
  }

  async findPublishedByCode(code: string): Promise<MonetizationProduct | null> {
    const row = await this.prisma.monetizationProduct.findFirst({
      where: { code, status: 'published' },
    });
    return row ? mapMonetizationProduct(row) : null;
  }

  async create(input: MonetizationProductUpsertInput): Promise<MonetizationProduct> {
    this.assertProductShape(input);
    const row = await this.prisma.monetizationProduct.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        status: input.status ?? 'draft',
        price: input.price,
        currency: input.currency ?? 'EUR',
        durationDays: input.durationDays ?? null,
        durationHours: input.durationHours ?? null,
        placement: input.placement ?? null,
        packageType: input.packageType ?? null,
        slotsPerDay: input.slotsPerDay ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return mapMonetizationProduct(row);
  }

  async update(id: string, input: MonetizationProductUpdateInput): Promise<MonetizationProduct> {
    const existing = await this.prisma.monetizationProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Monetization product not found');

    const merged = {
      type: input.type ?? existing.type,
      packageType: input.packageType ?? existing.packageType,
      placement: input.placement ?? existing.placement,
      durationDays: input.durationDays ?? existing.durationDays,
      durationHours: input.durationHours ?? existing.durationHours,
      slotsPerDay: input.slotsPerDay ?? existing.slotsPerDay,
    };
    this.assertProductShape(merged);

    const row = await this.prisma.monetizationProduct.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.durationDays !== undefined ? { durationDays: input.durationDays ?? null } : {}),
        ...(input.durationHours !== undefined ? { durationHours: input.durationHours ?? null } : {}),
        ...(input.placement !== undefined ? { placement: input.placement ?? null } : {}),
        ...(input.packageType !== undefined ? { packageType: input.packageType ?? null } : {}),
        ...(input.slotsPerDay !== undefined ? { slotsPerDay: input.slotsPerDay ?? null } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return mapMonetizationProduct(row);
  }

  private assertProductShape(input: {
    type: string;
    packageType?: string | null;
    placement?: string | null;
    durationDays?: number | null;
    durationHours?: number | null;
    slotsPerDay?: number | null;
  }) {
    if (input.type === 'listing_boost' && !input.packageType) {
      throw new BadRequestException('Boost products require a package type (PAID_7D or PAID_30D)');
    }
    if (input.type === 'featured_slot') {
      if (!input.placement) {
        throw new BadRequestException('Featured products require a placement (homepage or category)');
      }
      if (input.durationHours == null && input.durationDays == null) {
        throw new BadRequestException('Featured products require duration in hours or days');
      }
    }
  }
}
