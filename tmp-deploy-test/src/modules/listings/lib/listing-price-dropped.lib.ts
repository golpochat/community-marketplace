import type { PrismaService } from '../../../database/prisma.service';

type ListingPriceRow = {
  salePrice: { toNumber(): number } | number | null;
  originalPrice: { toNumber(): number } | number | null;
  activatedAt: Date | null;
  createdAt: Date;
};

export async function resolvePriceDroppedAt(
  prisma: PrismaService,
  listingId: string,
  row: ListingPriceRow,
): Promise<string | undefined> {
  const salePrice = row.salePrice != null ? Number(row.salePrice) : null;
  const originalPrice = row.originalPrice != null ? Number(row.originalPrice) : null;

  if (salePrice == null || originalPrice == null || salePrice >= originalPrice) {
    return undefined;
  }

  const logs = await prisma.priceChangeLog.findMany({
    where: { listingId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      oldSalePrice: true,
      newSalePrice: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  for (const log of logs) {
    const oldSale = log.oldSalePrice != null ? Number(log.oldSalePrice) : null;
    const newSale = log.newSalePrice != null ? Number(log.newSalePrice) : null;
    if (oldSale != null && newSale != null && newSale < oldSale) {
      return (log.reviewedAt ?? log.createdAt).toISOString();
    }
  }

  return (row.activatedAt ?? row.createdAt).toISOString();
}
