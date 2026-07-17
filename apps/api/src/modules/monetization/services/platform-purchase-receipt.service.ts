import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PlatformPurchaseType } from '@community-marketplace/types';

import { buildPlatformPurchaseInvoicePdf } from '../../../libs/document-pdf/financial-documents.pdf';
import { PrismaService } from '../../../database/prisma.service';
import { DevUploadService } from '../../dev-upload/dev-upload.service';
import { PaymentReceiptEmailService } from '../../payments/services/payment-receipt-email.service';
import { R2StorageService } from '../../users/services/r2-storage.service';
import { LoggerLib } from '../../../libs/logger.lib';
import {
  PLATFORM_PURCHASE_LABELS,
  buildPlatformInvoiceNumber,
  describePlatformPurchase,
  type PlatformPurchaseInvoiceData,
} from '../lib/platform-purchase-invoice.types';
import { buildPlatformPurchaseInvoiceEmail } from '../templates/platform-purchase-invoice-email.template';

const INVOICE_PREFIX = 'platform-invoices';
const PDF_CONTENT_TYPE = 'application/pdf';

@Injectable()
export class PlatformPurchaseReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2StorageService,
    private readonly devUpload: DevUploadService,
    private readonly receiptEmail: PaymentReceiptEmailService,
    private readonly logger: LoggerLib,
  ) {}

  async generateForPurchase(purchaseId: string, notify = true): Promise<void> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: { include: { profile: true } },
        listing: { select: { title: true } },
      },
    });

    if (!purchase || purchase.status !== 'succeeded') return;
    if (purchase.type === 'buyer_statement') return;
    if (!this.needsInvoiceGeneration(purchase)) return;

    const metadata =
      purchase.metadata && typeof purchase.metadata === 'object' && !Array.isArray(purchase.metadata)
        ? (purchase.metadata as Record<string, unknown>)
        : {};

    const issuedAt = purchase.receiptGeneratedAt ?? purchase.fulfilledAt ?? purchase.updatedAt;
    const invoiceNumber =
      purchase.receiptNumber ?? buildPlatformInvoiceNumber(purchase.id, issuedAt);
    const docData = this.toDocumentData(purchase, metadata, invoiceNumber, issuedAt.toISOString());
    const invoicePdf = await buildPlatformPurchaseInvoicePdf(docData);
    const receiptKey = `${INVOICE_PREFIX}/${purchase.id}/invoice.pdf`;

    await this.storeFile(receiptKey, invoicePdf);

    await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: {
        receiptNumber: invoiceNumber,
        receiptKey,
        receiptGeneratedAt: new Date(),
      },
    });

    if (!notify) return;

    const emailContent = buildPlatformPurchaseInvoiceEmail(
      docData,
      `/account/earnings`,
    );

    try {
      await this.receiptEmail.sendReceiptEmail(purchase.user.email, emailContent, invoicePdf);
    } catch (error) {
      this.logger.error(
        'PlatformPurchaseReceiptService',
        `Failed to email invoice for purchase ${purchase.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async getInvoiceFile(purchaseId: string, userId: string) {
    const purchase = await this.assertAccess(purchaseId, userId);
    return this.readInvoiceFile(
      purchase.receiptKey,
      `invoice-${purchase.receiptNumber ?? purchaseId}.pdf`,
    );
  }

  private needsInvoiceGeneration(purchase: {
    receiptGeneratedAt: Date | null;
    receiptKey: string | null;
  }): boolean {
    if (!purchase.receiptGeneratedAt || !purchase.receiptKey) return true;
    return !purchase.receiptKey.endsWith('.pdf');
  }

  private async assertAccess(purchaseId: string, userId: string) {
    const purchase = await this.prisma.platformPurchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.userId !== userId) throw new ForbiddenException('You can only access your own purchases');
    if (purchase.status !== 'succeeded') {
      throw new BadRequestException('Invoice is only available for completed purchases');
    }
    if (this.needsInvoiceGeneration(purchase)) {
      await this.generateForPurchase(purchaseId, false);
      const refreshed = await this.prisma.platformPurchase.findUnique({ where: { id: purchaseId } });
      if (!refreshed?.receiptKey) {
        throw new NotFoundException('Invoice not available yet');
      }
      return refreshed;
    }
    return purchase;
  }

  private async readInvoiceFile(key: string | null, filename: string) {
    if (!key) throw new NotFoundException('Invoice not found');
    const buffer = await this.readFile(key);
    return {
      buffer,
      filename,
      contentType: PDF_CONTENT_TYPE,
    };
  }

  private async storeFile(key: string, body: Buffer): Promise<void> {
    if (this.r2.isConfigured()) {
      await this.r2.putObject(key, body, PDF_CONTENT_TYPE);
      return;
    }
    await this.devUpload.save(key, body);
  }

  private async readFile(key: string): Promise<Buffer> {
    if (this.r2.isConfigured()) {
      return this.r2.getObjectBuffer(key);
    }
    const { buffer } = await this.devUpload.read(key);
    return buffer;
  }

  private toDocumentData(
    purchase: {
      id: string;
      type: string;
      amount: { toString(): string };
      currency: string;
      providerPaymentId: string | null;
      listing: { title: string } | null;
      user: {
        email: string;
        displayName: string | null;
        profile: { businessName: string | null } | null;
      };
    },
    metadata: Record<string, unknown>,
    invoiceNumber: string,
    issuedAt: string,
  ): PlatformPurchaseInvoiceData {
    const purchaseType = purchase.type as PlatformPurchaseType;
    return {
      invoiceNumber,
      purchaseId: purchase.id,
      issuedAt,
      currency: purchase.currency,
      amount: Number(purchase.amount),
      purchaseType,
      purchaseLabel: PLATFORM_PURCHASE_LABELS[purchaseType],
      purchaseDescription: describePlatformPurchase(
        purchaseType,
        metadata,
        purchase.listing?.title,
      ),
      customerName:
        purchase.user.profile?.businessName ??
        purchase.user.displayName ??
        purchase.user.email,
      customerEmail: purchase.user.email,
      listingTitle: purchase.listing?.title,
      providerReference: purchase.providerPaymentId ?? undefined,
      webAppUrl: process.env.WEB_APP_URL ?? 'https://sellnearby.ie',
    };
  }
}
