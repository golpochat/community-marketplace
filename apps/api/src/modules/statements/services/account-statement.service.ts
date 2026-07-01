import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DEFAULT_BUYER_STATEMENT_PRICE_EUR, usesSeparateConnectCharges } from '@community-marketplace/config';

import { buildAccountStatementPdf } from '../../../libs/document-pdf/statement-documents.pdf';
import { PrismaService } from '../../../database/prisma.service';
import { DevUploadService } from '../../dev-upload/dev-upload.service';
import {
  PLATFORM_PURCHASE_LABELS,
  buildPlatformInvoiceNumber,
} from '../../monetization/lib/platform-purchase-invoice.types';
import { R2StorageService } from '../../users/services/r2-storage.service';
import {
  STATEMENT_EXPORT_CONTENT_TYPES,
  buildStatementCsv,
  buildStatementXlsx,
  type StatementExportFormat,
} from '../lib/account-statement-export';
import {
  type AccountStatementData,
  buildRangeStatementNumber,
  buildStatementNumber,
  formatStatementPeriodLabel,
  formatStatementPeriodRange,
  parseDateRangeBounds,
  statementPeriodBounds,
} from '../lib/account-statement.types';

const STATEMENT_PREFIX = 'account-statements';
const PDF_CONTENT_TYPE = 'application/pdf';

export interface StatementExportFile {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

@Injectable()
export class AccountStatementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2StorageService,
    private readonly devUpload: DevUploadService,
  ) {}

  async buildSellerStatementPdf(sellerId: string, year: number, month: number): Promise<Buffer> {
    const file = await this.exportSellerStatement(sellerId, year, month, 'pdf');
    return file.buffer;
  }

  async buildBuyerStatementPdf(buyerId: string, year: number, month: number): Promise<Buffer> {
    const file = await this.exportBuyerStatement(buyerId, year, month, 'pdf');
    return file.buffer;
  }

  async buildAdminSellerStatementPdf(userId: string, year: number, month: number): Promise<Buffer> {
    const file = await this.exportAdminSellerStatement(userId, year, month, 'pdf');
    return file.buffer;
  }

  async buildAdminBuyerStatementPdf(userId: string, year: number, month: number): Promise<Buffer> {
    const file = await this.exportAdminBuyerStatement(userId, year, month, 'pdf');
    return file.buffer;
  }

  async exportSellerStatement(
    sellerId: string,
    year: number,
    month: number,
    format: StatementExportFormat,
  ): Promise<StatementExportFile> {
    const data = await this.loadSellerStatementData(sellerId, year, month);
    return this.exportStatementData(data, format, sellerId, year, month);
  }

  async exportBuyerStatement(
    buyerId: string,
    year: number,
    month: number,
    format: StatementExportFormat,
  ): Promise<StatementExportFile> {
    if (format === 'pdf') {
      return this.getBuyerStatementFile(buyerId, year, month);
    }
    await this.assertBuyerStatementUnlocked(buyerId, year, month);
    const data = await this.loadBuyerStatementData(buyerId, year, month);
    return this.exportStatementData(data, format, buyerId, year, month);
  }

  async exportAdminSellerStatement(
    userId: string,
    year: number,
    month: number,
    format: StatementExportFormat,
  ): Promise<StatementExportFile> {
    await this.assertUserExists(userId);
    const data = await this.loadSellerStatementData(userId, year, month);
    return this.exportStatementData(data, format, userId, year, month);
  }

  async exportAdminBuyerStatement(
    userId: string,
    year: number,
    month: number,
    format: StatementExportFormat,
  ): Promise<StatementExportFile> {
    await this.assertUserExists(userId);
    const data = await this.loadBuyerStatementData(userId, year, month);
    return this.exportStatementData(data, format, userId, year, month);
  }

  async exportAdminSellerStatementForRange(
    userId: string,
    dateFrom: string,
    dateTo: string,
    format: StatementExportFormat,
  ): Promise<StatementExportFile> {
    await this.assertUserExists(userId);
    const data = await this.loadSellerStatementDataForRange(userId, dateFrom, dateTo);
    return this.exportStatementDataForRange(data, format, userId, dateFrom, dateTo);
  }

  async exportAdminBuyerStatementForRange(
    userId: string,
    dateFrom: string,
    dateTo: string,
    format: StatementExportFormat,
  ): Promise<StatementExportFile> {
    await this.assertUserExists(userId);
    const data = await this.loadBuyerStatementDataForRange(userId, dateFrom, dateTo);
    return this.exportStatementDataForRange(data, format, userId, dateFrom, dateTo);
  }

  statementRangeFilename(
    role: 'seller' | 'buyer',
    userId: string,
    dateFrom: string,
    dateTo: string,
    format: StatementExportFormat = 'pdf',
  ): string {
    const base = `statement-${buildRangeStatementNumber(role, dateFrom, dateTo, userId)}`;
    if (format === 'pdf') return `${base}.pdf`;
    if (format === 'csv') return `${base}.csv`;
    return `${base}.xlsx`;
  }

  async getBuyerStatementStatus(buyerId: string, year: number, month: number) {
    this.assertValidPeriod(year, month);
    const purchase = await this.findBuyerStatementPurchase(buyerId, year, month);
    const settings = await this.resolveBuyerStatementPrice();
    return {
      year,
      month,
      periodLabel: formatStatementPeriodLabel(year, month),
      unlocked: purchase?.status === 'succeeded',
      price: settings.amount,
      currency: settings.currency,
      pendingPurchase:
        purchase?.status === 'pending'
          ? { id: purchase.id, amount: Number(purchase.amount), currency: purchase.currency }
          : undefined,
    };
  }

  async storeBuyerStatementPdf(
    buyerId: string,
    year: number,
    month: number,
    purchaseId: string,
  ): Promise<string> {
    const data = await this.loadBuyerStatementData(buyerId, year, month);
    const pdf = await buildAccountStatementPdf(data);
    const key = `${STATEMENT_PREFIX}/${buyerId}/${year}-${String(month).padStart(2, '0')}/${purchaseId}.pdf`;
    await this.storeFile(key, pdf);
    return key;
  }

  async getBuyerStatementFile(buyerId: string, year: number, month: number) {
    this.assertValidPeriod(year, month);
    const purchase = await this.assertBuyerStatementUnlocked(buyerId, year, month);
    let key = purchase.receiptKey;
    if (!key || !key.endsWith('.pdf')) {
      key = await this.storeBuyerStatementPdf(buyerId, year, month, purchase.id);
      await this.prisma.platformPurchase.update({
        where: { id: purchase.id },
        data: { receiptKey: key, receiptGeneratedAt: new Date() },
      });
    }
    const buffer = await this.readFile(key);
    const statementNumber = buildStatementNumber('buyer', year, month, buyerId);
    return {
      buffer,
      filename: `statement-${statementNumber}.pdf`,
      contentType: PDF_CONTENT_TYPE,
    };
  }

  statementFilename(
    role: 'seller' | 'buyer',
    userId: string,
    year: number,
    month: number,
    format: StatementExportFormat = 'pdf',
  ): string {
    const base = `statement-${buildStatementNumber(role, year, month, userId)}`;
    if (format === 'pdf') return `${base}.pdf`;
    if (format === 'csv') return `${base}.csv`;
    return `${base}.xlsx`;
  }

  private async exportStatementData(
    data: AccountStatementData,
    format: StatementExportFormat,
    userId: string,
    year: number,
    month: number,
  ): Promise<StatementExportFile> {
    const role = data.role;

    if (format === 'pdf') {
      const buffer = await buildAccountStatementPdf(data);
      return {
        buffer,
        filename: this.statementFilename(role, userId, year, month, 'pdf'),
        contentType: PDF_CONTENT_TYPE,
      };
    }

    if (format === 'csv') {
      const csv = buildStatementCsv(data);
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        filename: this.statementFilename(role, userId, year, month, 'csv'),
        contentType: STATEMENT_EXPORT_CONTENT_TYPES.csv,
      };
    }

    const buffer = await buildStatementXlsx(data);
    return {
      buffer,
      filename: this.statementFilename(role, userId, year, month, 'xlsx'),
      contentType: STATEMENT_EXPORT_CONTENT_TYPES.xlsx,
    };
  }

  private async exportStatementDataForRange(
    data: AccountStatementData,
    format: StatementExportFormat,
    userId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<StatementExportFile> {
    const role = data.role;

    if (format === 'pdf') {
      const buffer = await buildAccountStatementPdf(data);
      return {
        buffer,
        filename: this.statementRangeFilename(role, userId, dateFrom, dateTo, 'pdf'),
        contentType: PDF_CONTENT_TYPE,
      };
    }

    if (format === 'csv') {
      const csv = buildStatementCsv(data);
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        filename: this.statementRangeFilename(role, userId, dateFrom, dateTo, 'csv'),
        contentType: STATEMENT_EXPORT_CONTENT_TYPES.csv,
      };
    }

    const buffer = await buildStatementXlsx(data);
    return {
      buffer,
      filename: this.statementRangeFilename(role, userId, dateFrom, dateTo, 'xlsx'),
      contentType: STATEMENT_EXPORT_CONTENT_TYPES.xlsx,
    };
  }

  async resolveBuyerStatementPrice(): Promise<{ amount: number; currency: string; enabled: boolean }> {
    const row = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const pricing = row?.pricing as { currency?: string; skus?: Record<string, { amount?: number; enabled?: boolean }> } | null;
    const sku = pricing?.skus?.buyer_statement;
    return {
      amount: sku?.amount ?? DEFAULT_BUYER_STATEMENT_PRICE_EUR,
      currency: (pricing?.currency ?? 'EUR').toUpperCase(),
      enabled: sku?.enabled ?? true,
    };
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async assertBuyerStatementUnlocked(buyerId: string, year: number, month: number) {
    this.assertValidPeriod(year, month);
    const purchase = await this.findBuyerStatementPurchase(buyerId, year, month);
    if (!purchase || purchase.status !== 'succeeded') {
      throw new ForbiddenException('Purchase a statement unlock for this period before downloading');
    }
    return purchase;
  }

  private async findBuyerStatementPurchase(buyerId: string, year: number, month: number) {
    const rows = await this.prisma.platformPurchase.findMany({
      where: {
        userId: buyerId,
        type: 'buyer_statement',
        status: { in: ['pending', 'succeeded'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.find((row) => {
      const meta = this.readMetadata(row.metadata);
      return meta.year === year && meta.month === month;
    }) ?? null;
  }

  private async loadSellerStatementData(
    sellerId: string,
    year: number,
    month: number,
  ): Promise<AccountStatementData> {
    this.assertValidPeriod(year, month);
    const { start, end } = statementPeriodBounds(year, month);
    const issuedAt = new Date();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: sellerId },
      include: { profile: true },
    });

    const [payments, platformPurchases, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          sellerId,
          status: 'succeeded',
          createdAt: { gte: start, lte: end },
        },
        include: { listing: { select: { title: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.platformPurchase.findMany({
        where: {
          userId: sellerId,
          status: 'succeeded',
          type: { not: 'buyer_statement' },
          createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payout.findMany({
        where: {
          sellerId,
          status: 'paid',
          createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const currency = payments[0]?.currency ?? platformPurchases[0]?.currency ?? 'EUR';

    const salesLines = payments.map((payment) => {
      const gross = Number(payment.amount);
      const marketplaceFee = Number(payment.platformFee ?? 0);
      return {
        date: payment.createdAt.toISOString(),
        listingTitle: payment.listing.title,
        receiptRef: payment.receiptNumber ?? payment.id.slice(0, 8).toUpperCase(),
        gross,
        marketplaceFee,
        netToSeller: gross - marketplaceFee,
        currency: payment.currency,
      };
    });

    const platformServiceLines = platformPurchases.map((purchase) => {
      const issued = purchase.fulfilledAt ?? purchase.createdAt;
      return {
        date: issued.toISOString(),
        serviceLabel:
          PLATFORM_PURCHASE_LABELS[purchase.type as keyof typeof PLATFORM_PURCHASE_LABELS] ??
          purchase.type,
        invoiceNumber:
          purchase.receiptNumber ?? buildPlatformInvoiceNumber(purchase.id, issued),
        amount: Number(purchase.amount),
        currency: purchase.currency,
      };
    });

    const payoutLines = payouts.map((payout) => ({
      date: payout.createdAt.toISOString(),
      amount: Number(payout.amount),
      currency: payout.currency,
      status: payout.status,
      reference: payout.providerPayoutId ?? payout.id.slice(0, 8).toUpperCase(),
    }));

    let pendingSettlementNet = 0;
    if (usesSeparateConnectCharges() && payments.length > 0) {
      const settledLogs = await this.prisma.paymentAuditLog.findMany({
        where: {
          paymentId: { in: payments.map((payment) => payment.id) },
          eventType: 'seller_settlement',
        },
        select: { paymentId: true },
      });
      const settledIds = new Set(
        settledLogs.map((log) => log.paymentId).filter((id): id is string => Boolean(id)),
      );
      pendingSettlementNet = payments
        .filter((payment) => !settledIds.has(payment.id))
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount) - Number(payment.platformFee ?? 0),
          0,
        );
    }

    const grossSales = salesLines.reduce((sum, row) => sum + row.gross, 0);
    const marketplaceFeesOnSales = salesLines.reduce((sum, row) => sum + row.marketplaceFee, 0);
    const netFromSales = grossSales - marketplaceFeesOnSales;
    const platformServices = platformServiceLines.reduce((sum, row) => sum + row.amount, 0);
    const payoutsReceivedInPeriod = payoutLines.reduce((sum, row) => sum + row.amount, 0);

    return {
      statementNumber: buildStatementNumber('seller', year, month, sellerId),
      role: 'seller',
      periodLabel: formatStatementPeriodLabel(year, month),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      issuedAt: issuedAt.toISOString(),
      isPartialPeriod: issuedAt < end,
      accountHolderName: user.profile?.businessName ?? user.displayName ?? user.email,
      accountHolderEmail: user.email,
      salesLines,
      platformServiceLines,
      payoutLines,
      buyerPurchaseLines: [],
      summary: {
        grossSales,
        marketplaceFeesOnSales,
        netFromSales,
        platformServices,
        netPeriodActivity: netFromSales - platformServices,
        payoutsReceivedInPeriod,
        pendingSettlementNet,
        currency,
        saleCount: salesLines.length,
        platformServiceCount: platformServiceLines.length,
        payoutCount: payoutLines.length,
      },
    };
  }

  private async loadBuyerStatementData(
    buyerId: string,
    year: number,
    month: number,
  ): Promise<AccountStatementData> {
    this.assertValidPeriod(year, month);
    const { start, end } = statementPeriodBounds(year, month);
    const issuedAt = new Date();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: buyerId },
      include: { profile: true },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        buyerId,
        status: 'succeeded',
        createdAt: { gte: start, lte: end },
      },
      include: { listing: { select: { title: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const currency = payments[0]?.currency ?? 'EUR';
    const buyerPurchaseLines = payments.map((payment) => ({
      date: payment.createdAt.toISOString(),
      listingTitle: payment.listing.title,
      receiptRef: payment.receiptNumber ?? payment.id.slice(0, 8).toUpperCase(),
      amount: Number(payment.amount),
      currency: payment.currency,
    }));

    const totalPurchases = buyerPurchaseLines.reduce((sum, row) => sum + row.amount, 0);

    return {
      statementNumber: buildStatementNumber('buyer', year, month, buyerId),
      role: 'buyer',
      periodLabel: formatStatementPeriodLabel(year, month),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      issuedAt: issuedAt.toISOString(),
      isPartialPeriod: issuedAt < end,
      accountHolderName: user.displayName ?? user.email,
      accountHolderEmail: user.email,
      salesLines: [],
      platformServiceLines: [],
      payoutLines: [],
      buyerPurchaseLines,
      summary: {
        totalPurchases,
        currency,
        purchaseCount: buyerPurchaseLines.length,
      },
    };
  }

  private async loadSellerStatementDataForRange(
    sellerId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<AccountStatementData> {
    const { start, end } = parseDateRangeBounds(dateFrom, dateTo);
    const issuedAt = new Date();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: sellerId },
      include: { profile: true },
    });

    const [payments, platformPurchases, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          sellerId,
          status: 'succeeded',
          createdAt: { gte: start, lte: end },
        },
        include: { listing: { select: { title: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.platformPurchase.findMany({
        where: {
          userId: sellerId,
          status: 'succeeded',
          type: { not: 'buyer_statement' },
          createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payout.findMany({
        where: {
          sellerId,
          status: 'paid',
          createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const currency = payments[0]?.currency ?? platformPurchases[0]?.currency ?? 'EUR';

    const salesLines = payments.map((payment) => {
      const gross = Number(payment.amount);
      const marketplaceFee = Number(payment.platformFee ?? 0);
      return {
        date: payment.createdAt.toISOString(),
        listingTitle: payment.listing.title,
        receiptRef: payment.receiptNumber ?? payment.id.slice(0, 8).toUpperCase(),
        gross,
        marketplaceFee,
        netToSeller: gross - marketplaceFee,
        currency: payment.currency,
      };
    });

    const platformServiceLines = platformPurchases.map((purchase) => {
      const issued = purchase.fulfilledAt ?? purchase.createdAt;
      return {
        date: issued.toISOString(),
        serviceLabel:
          PLATFORM_PURCHASE_LABELS[purchase.type as keyof typeof PLATFORM_PURCHASE_LABELS] ??
          purchase.type,
        invoiceNumber:
          purchase.receiptNumber ?? buildPlatformInvoiceNumber(purchase.id, issued),
        amount: Number(purchase.amount),
        currency: purchase.currency,
      };
    });

    const payoutLines = payouts.map((payout) => ({
      date: payout.createdAt.toISOString(),
      amount: Number(payout.amount),
      currency: payout.currency,
      status: payout.status,
      reference: payout.providerPayoutId ?? payout.id.slice(0, 8).toUpperCase(),
    }));

    let pendingSettlementNet = 0;
    if (usesSeparateConnectCharges() && payments.length > 0) {
      const settledLogs = await this.prisma.paymentAuditLog.findMany({
        where: {
          paymentId: { in: payments.map((payment) => payment.id) },
          eventType: 'seller_settlement',
        },
        select: { paymentId: true },
      });
      const settledIds = new Set(
        settledLogs.map((log) => log.paymentId).filter((id): id is string => Boolean(id)),
      );
      pendingSettlementNet = payments
        .filter((payment) => !settledIds.has(payment.id))
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount) - Number(payment.platformFee ?? 0),
          0,
        );
    }

    const grossSales = salesLines.reduce((sum, row) => sum + row.gross, 0);
    const marketplaceFeesOnSales = salesLines.reduce((sum, row) => sum + row.marketplaceFee, 0);
    const netFromSales = grossSales - marketplaceFeesOnSales;
    const platformServices = platformServiceLines.reduce((sum, row) => sum + row.amount, 0);
    const payoutsReceivedInPeriod = payoutLines.reduce((sum, row) => sum + row.amount, 0);

    return {
      statementNumber: buildRangeStatementNumber('seller', dateFrom, dateTo, sellerId),
      role: 'seller',
      periodLabel: formatStatementPeriodRange(start, end),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      issuedAt: issuedAt.toISOString(),
      isPartialPeriod: issuedAt < end,
      accountHolderName: user.profile?.businessName ?? user.displayName ?? user.email,
      accountHolderEmail: user.email,
      salesLines,
      platformServiceLines,
      payoutLines,
      buyerPurchaseLines: [],
      summary: {
        grossSales,
        marketplaceFeesOnSales,
        netFromSales,
        platformServices,
        netPeriodActivity: netFromSales - platformServices,
        payoutsReceivedInPeriod,
        pendingSettlementNet,
        currency,
        saleCount: salesLines.length,
        platformServiceCount: platformServiceLines.length,
        payoutCount: payoutLines.length,
      },
    };
  }

  private async loadBuyerStatementDataForRange(
    buyerId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<AccountStatementData> {
    const { start, end } = parseDateRangeBounds(dateFrom, dateTo);
    const issuedAt = new Date();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: buyerId },
      include: { profile: true },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        buyerId,
        status: 'succeeded',
        createdAt: { gte: start, lte: end },
      },
      include: { listing: { select: { title: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const currency = payments[0]?.currency ?? 'EUR';
    const buyerPurchaseLines = payments.map((payment) => ({
      date: payment.createdAt.toISOString(),
      listingTitle: payment.listing.title,
      receiptRef: payment.receiptNumber ?? payment.id.slice(0, 8).toUpperCase(),
      amount: Number(payment.amount),
      currency: payment.currency,
    }));

    const totalPurchases = buyerPurchaseLines.reduce((sum, row) => sum + row.amount, 0);

    return {
      statementNumber: buildRangeStatementNumber('buyer', dateFrom, dateTo, buyerId),
      role: 'buyer',
      periodLabel: formatStatementPeriodRange(start, end),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      issuedAt: issuedAt.toISOString(),
      isPartialPeriod: issuedAt < end,
      accountHolderName: user.displayName ?? user.email,
      accountHolderEmail: user.email,
      salesLines: [],
      platformServiceLines: [],
      payoutLines: [],
      buyerPurchaseLines,
      summary: {
        totalPurchases,
        currency,
        purchaseCount: buyerPurchaseLines.length,
      },
    };
  }

  private assertValidPeriod(year: number, month: number): void {
    const now = new Date();
    if (!Number.isInteger(year) || year < 2020 || year > now.getFullYear() + 1) {
      throw new BadRequestException('Invalid statement year');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid statement month');
    }
    const periodStart = statementPeriodBounds(year, month).start;
    if (periodStart > now) {
      throw new BadRequestException('Statements are not available for future periods');
    }
  }

  private readMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private async storeFile(key: string, body: Buffer): Promise<void> {
    if (this.r2.isConfigured()) {
      await this.r2.putObject(key, body, PDF_CONTENT_TYPE);
      return;
    }
    await this.devUpload.save(key, body);
  }

  private async readFile(key: string): Promise<Buffer> {
    if (!key) throw new NotFoundException('Statement not found');
    if (this.r2.isConfigured()) {
      return this.r2.getObjectBuffer(key);
    }
    const { buffer } = await this.devUpload.read(key);
    return buffer;
  }
}
