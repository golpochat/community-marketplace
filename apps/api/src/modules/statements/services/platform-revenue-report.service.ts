import { BadRequestException, Injectable } from '@nestjs/common';

import {
  getInvoiceCompanyConfig,
  splitVatFromGross,
} from '@community-marketplace/config';

import { buildPlatformRevenueReportPdf } from '../../../libs/document-pdf/platform-revenue-report.pdf';
import { PrismaService } from '../../../database/prisma.service';
import {
  buildPlatformInvoiceNumber,
  describePlatformPurchase,
  PLATFORM_PURCHASE_LABELS,
} from '../../monetization/lib/platform-purchase-invoice.types';
import {
  formatStatementPeriodLabel,
  formatStatementPeriodRange,
  parseDateRangeBounds,
  statementPeriodBounds,
} from '../lib/account-statement.types';
import {
  buildPlatformRevenueCsv,
  buildPlatformRevenueXlsx,
} from '../lib/platform-revenue-export';
import {
  buildFinanceRecords,
  applyRecordFilters,
  type FinanceRecordCategory,
  type TradePaymentLine,
} from '../lib/finance-records.util';
import {
  buildPlatformRevenueReportNumber,
  buildPlatformRevenueReportNumberForMonth,
  type MarketplaceFeeLine,
  type PlatformRevenueInvoiceLine,
  type PlatformRevenueReportData,
  type PlatformRevenueSummary,
} from '../lib/platform-revenue-report.types';

export interface FinanceReportQueryOptions {
  dateFrom: string;
  dateTo: string;
  categories?: string[];
  search?: string;
}

@Injectable()
export class PlatformRevenueReportService {
  constructor(private readonly prisma: PrismaService) {}

  async loadReport(year: number, month: number): Promise<PlatformRevenueReportData> {
    this.assertValidPeriod(year, month);
    const { start, end } = statementPeriodBounds(year, month);
    const dateFrom = start.toISOString().slice(0, 10);
    const dateTo = end.toISOString().slice(0, 10);
    const data = await this.loadReportForRange(dateFrom, dateTo);
    return {
      ...data,
      reportNumber: buildPlatformRevenueReportNumberForMonth(year, month),
      periodLabel: formatStatementPeriodLabel(year, month),
    };
  }

  async loadReportForRange(dateFrom: string, dateTo: string): Promise<PlatformRevenueReportData> {
    const { start, end } = parseDateRangeBounds(dateFrom, dateTo);
    const issuedAt = new Date();
    const isPartialPeriod = issuedAt < end;

    const [platformPurchases, tradePaymentsRaw] = await Promise.all([
      this.prisma.platformPurchase.findMany({
        where: {
          status: 'succeeded',
          createdAt: { gte: start, lte: end },
        },
        include: {
          user: true,
          listing: { select: { title: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: {
          status: 'succeeded',
          createdAt: { gte: start, lte: end },
        },
        include: {
          listing: { select: { title: true } },
          buyer: true,
          seller: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const currency =
      platformPurchases[0]?.currency ?? tradePaymentsRaw[0]?.currency ?? 'EUR';

    const platformInvoices: PlatformRevenueInvoiceLine[] = platformPurchases.map((purchase) => {
      const issued = purchase.fulfilledAt ?? purchase.createdAt;
      const metadata = this.readMetadata(purchase.metadata);
      const customerName =
        purchase.user.displayName?.trim() ||
        purchase.user.email.split('@')[0] ||
        'Customer';
      return {
        date: issued.toISOString(),
        invoiceNumber:
          purchase.receiptNumber ?? buildPlatformInvoiceNumber(purchase.id, issued),
        customerName,
        customerEmail: purchase.user.email,
        serviceLabel:
          describePlatformPurchase(
            purchase.type,
            metadata,
            purchase.listing?.title,
          ) ??
          PLATFORM_PURCHASE_LABELS[purchase.type as keyof typeof PLATFORM_PURCHASE_LABELS] ??
          purchase.type,
        gross: Number(purchase.amount),
        currency: purchase.currency,
      };
    });

    const tradePayments: TradePaymentLine[] = tradePaymentsRaw.map((payment) => ({
      date: payment.createdAt.toISOString(),
      receiptRef: payment.receiptNumber ?? payment.id.slice(0, 8).toUpperCase(),
      listingTitle: payment.listing.title,
      gross: Number(payment.amount),
      platformFee: Number(payment.platformFee ?? 0),
      currency: payment.currency,
      buyerName:
        payment.buyer.displayName?.trim() ||
        payment.buyer.email.split('@')[0] ||
        'Buyer',
      buyerEmail: payment.buyer.email,
      sellerName:
        payment.seller.displayName?.trim() ||
        payment.seller.email.split('@')[0] ||
        'Seller',
      sellerEmail: payment.seller.email,
    }));

    const marketplaceFees: MarketplaceFeeLine[] = tradePayments
      .filter((row) => row.platformFee > 0)
      .map((row) => ({
        date: row.date,
        receiptRef: row.receiptRef,
        listingTitle: row.listingTitle,
        sellerName: row.sellerName,
        sellerEmail: row.sellerEmail,
        fee: row.platformFee,
        currency: row.currency,
      }));

    const summary = this.buildSummary(platformInvoices, marketplaceFees, currency);
    const records = buildFinanceRecords(platformInvoices, tradePayments);

    return {
      reportNumber: buildPlatformRevenueReportNumber(dateFrom, dateTo),
      periodLabel: formatStatementPeriodRange(start, end),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      issuedAt: issuedAt.toISOString(),
      isPartialPeriod,
      sellerFilterApplied: false,
      sellerFilterCount: 0,
      records,
      platformInvoices,
      marketplaceFees,
      summary,
    };
  }

  loadFilteredReport(options: FinanceReportQueryOptions): Promise<PlatformRevenueReportData> {
    return this.loadReportForRange(options.dateFrom, options.dateTo).then((data) =>
      applyRecordFilters(data, {
        categories: options.categories as FinanceRecordCategory[] | undefined,
        search: options.search,
      }),
    );
  }

  buildPdfForQuery(options: FinanceReportQueryOptions): Promise<Buffer> {
    return this.loadFilteredReport(options).then((data) => buildPlatformRevenueReportPdf(data));
  }

  buildCsvForQuery(options: FinanceReportQueryOptions): Promise<string> {
    return this.loadFilteredReport(options).then((data) => buildPlatformRevenueCsv(data));
  }

  buildXlsxForQuery(options: FinanceReportQueryOptions): Promise<Buffer> {
    return this.loadFilteredReport(options).then((data) => buildPlatformRevenueXlsx(data));
  }

  async buildPdfForRange(dateFrom: string, dateTo: string): Promise<Buffer> {
    const data = await this.loadReportForRange(dateFrom, dateTo);
    return buildPlatformRevenueReportPdf(data);
  }

  async buildPdf(year: number, month: number): Promise<Buffer> {
    const data = await this.loadReport(year, month);
    return buildPlatformRevenueReportPdf(data);
  }

  async buildCsvForRange(dateFrom: string, dateTo: string): Promise<string> {
    const data = await this.loadReportForRange(dateFrom, dateTo);
    return buildPlatformRevenueCsv(data);
  }

  async buildCsv(year: number, month: number): Promise<string> {
    const data = await this.loadReport(year, month);
    return buildPlatformRevenueCsv(data);
  }

  async buildXlsxForRange(dateFrom: string, dateTo: string): Promise<Buffer> {
    const data = await this.loadReportForRange(dateFrom, dateTo);
    return buildPlatformRevenueXlsx(data);
  }

  reportFilename(
    dateFrom: string,
    dateTo: string,
    ext: 'pdf' | 'csv' | 'xlsx',
  ): string {
    return `platform-revenue-${dateFrom}_${dateTo}.${ext}`;
  }

  /** @deprecated Use reportFilename(dateFrom, dateTo, ext) */
  reportFilenameForMonth(year: number, month: number, ext: 'pdf' | 'csv'): string {
    const ym = `${year}-${String(month).padStart(2, '0')}`;
    return `platform-revenue-${ym}.${ext}`;
  }

  private buildSummary(
    platformInvoices: PlatformRevenueInvoiceLine[],
    marketplaceFees: MarketplaceFeeLine[],
    currency: string,
  ): PlatformRevenueSummary {
    const platformServicesGross = platformInvoices.reduce((sum, row) => sum + row.gross, 0);
    const marketplaceFeesGross = marketplaceFees.reduce((sum, row) => sum + row.fee, 0);
    const totalRevenueGross = platformServicesGross + marketplaceFeesGross;

    const config = getInvoiceCompanyConfig();
    const base: PlatformRevenueSummary = {
      platformServicesGross,
      marketplaceFeesGross,
      totalRevenueGross,
      currency,
      platformInvoiceCount: platformInvoices.length,
      marketplaceFeeCount: marketplaceFees.length,
    };

    if (config.vatStatus === 'registered' && config.vatNumber) {
      const { net, vat } = splitVatFromGross(totalRevenueGross, config.defaultVatRate);
      return { ...base, netAmount: net, vatAmount: vat };
    }

    return base;
  }

  private readMetadata(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private assertValidPeriod(year: number, month: number): void {
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      throw new BadRequestException('Invalid year');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month');
    }
  }
}
