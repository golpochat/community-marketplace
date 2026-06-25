import { Injectable } from '@nestjs/common';

import type { DeliveryOption } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { mapDeliveryOption } from '../mappers/delivery.mapper';

@Injectable()
export class DeliveryOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<DeliveryOption[]> {
    const rows = await this.prisma.deliveryOption.findMany({
      where: { isActive: true },
      orderBy: [{ zone: 'asc' }, { label: 'asc' }],
    });
    return rows.map(mapDeliveryOption);
  }

  async findById(id: string) {
    return this.prisma.deliveryOption.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]) {
    return this.prisma.deliveryOption.findMany({
      where: { id: { in: ids }, isActive: true },
    });
  }
}
