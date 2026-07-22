import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PaymentsFraudService {
  private readonly maxDailyPayments = Number(process.env.MAX_DAILY_PAYMENTS_PER_USER ?? 10);

  constructor(private readonly prisma: PrismaService) {}

  async validatePurchase(buyerId: string, listingId: string, sellerId: string) {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { status: true },
    });
    if (!buyer || buyer.status !== 'active') {
      throw new BadRequestException('Buyer account is not eligible for payments');
    }

    const activeBan = await this.prisma.userBan.findFirst({
      where: {
        userId: buyerId,
        liftedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (activeBan) {
      throw new BadRequestException('Account restricted from making payments');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { include: { verifications: { where: { badgeGranted: true, status: 'approved' }, take: 1 } } } },
    });
    if (!listing || (listing.status !== 'active' && listing.status !== 'reserved')) {
      throw new BadRequestException('Listing is not available for purchase');
    }
    if (listing.status === 'reserved') {
      const reserve = await this.prisma.listingReserve.findFirst({
        where: { listingId, status: 'active', buyerId },
      });
      if (!reserve) {
        throw new BadRequestException('This listing is reserved for another buyer');
      }
    }
    if (listing.sellerId !== sellerId) {
      throw new BadRequestException('Invalid seller for this listing');
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('Cannot purchase your own listing');
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.payment.count({
      where: { buyerId, createdAt: { gte: since } },
    });
    if (todayCount >= this.maxDailyPayments) {
      throw new BadRequestException('Daily payment limit exceeded');
    }

    return listing;
  }
}
