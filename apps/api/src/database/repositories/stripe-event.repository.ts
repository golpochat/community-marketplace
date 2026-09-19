import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

@Injectable()
export class StripeEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async claim(stripeEventId: string, eventType: string): Promise<boolean> {
    const claimed = await this.prisma.processedStripeEvent.createMany({
      data: { stripeEventId, eventType },
      skipDuplicates: true,
    });
    return claimed.count > 0;
  }

  async release(stripeEventId: string): Promise<void> {
    await this.prisma.processedStripeEvent.deleteMany({
      where: { stripeEventId },
    });
  }
}
