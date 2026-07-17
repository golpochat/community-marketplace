import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  buildBuyerReceiptPdf,
  buildSellerSalesRecordPdf,
} from '../../../libs/document-pdf/financial-documents.pdf';
import { PrismaService } from '../../../database/prisma.service';
import { DevUploadService } from '../../dev-upload/dev-upload.service';
import { R2StorageService } from '../../users/services/r2-storage.service';
import { LoggerLib } from '../../../libs/logger.lib';
import {
  buildReceiptNumber,
  type PaymentReceiptDocumentData,
} from '../lib/payment-receipt.types';
import {
  buildBuyerPaymentReceiptEmail,
  buildSellerPaymentRecordEmail,
} from '../templates/payment-receipt-email.template';
import { PaymentReceiptEmailService } from './payment-receipt-email.service';

const RECEIPT_PREFIX = 'payment-receipts';
const PDF_CONTENT_TYPE = 'application/pdf';

@Injectable()
export class PaymentReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2StorageService,
    private readonly devUpload: DevUploadService,
    private readonly receiptEmail: PaymentReceiptEmailService,
    private readonly logger: LoggerLib,
  ) {}

  async generateForPayment(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
        listing: true,
      },
    });

    if (!payment || payment.status !== 'succeeded') return;
    if (!this.needsReceiptGeneration(payment)) return;

    const issuedAt = payment.receiptGeneratedAt ?? payment.updatedAt;
    const receiptNumber = payment.receiptNumber ?? buildReceiptNumber(payment.id, issuedAt);
    const docData = this.toDocumentData(payment, receiptNumber, issuedAt.toISOString());

    const [buyerPdf, sellerPdf] = await Promise.all([
      buildBuyerReceiptPdf(docData),
      buildSellerSalesRecordPdf(docData),
    ]);

    const buyerKey = `${RECEIPT_PREFIX}/${payment.id}/buyer-receipt.pdf`;
    const sellerKey = `${RECEIPT_PREFIX}/${payment.id}/seller-record.pdf`;

    await Promise.all([
      this.storeFile(buyerKey, buyerPdf),
      this.storeFile(sellerKey, sellerPdf),
    ]);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        receiptNumber,
        buyerReceiptKey: buyerKey,
        sellerReceiptKey: sellerKey,
        receiptGeneratedAt: new Date(),
      },
    });

    const buyerEmailContent = buildBuyerPaymentReceiptEmail(
      docData,
      `/account/purchases`,
    );
    const sellerEmailContent = buildSellerPaymentRecordEmail(
      docData,
      `/account/earnings`,
    );

    await Promise.allSettled([
      this.receiptEmail.sendReceiptEmail(payment.buyer.email, buyerEmailContent, buyerPdf),
      this.receiptEmail.sendReceiptEmail(payment.seller.email, sellerEmailContent, sellerPdf),
    ]);
  }

  async getBuyerReceiptFile(paymentId: string, userId: string) {
    const payment = await this.assertReceiptAccess(paymentId, userId, 'buyer');
    return this.readReceiptFile(payment.buyerReceiptKey, `receipt-${payment.receiptNumber}.pdf`);
  }

  async getSellerReceiptFile(paymentId: string, userId: string) {
    const payment = await this.assertReceiptAccess(paymentId, userId, 'seller');
    return this.readReceiptFile(
      payment.sellerReceiptKey,
      `sales-record-${payment.receiptNumber}.pdf`,
    );
  }

  private needsReceiptGeneration(payment: {
    receiptGeneratedAt: Date | null;
    buyerReceiptKey: string | null;
    sellerReceiptKey: string | null;
  }): boolean {
    if (!payment.receiptGeneratedAt || !payment.buyerReceiptKey || !payment.sellerReceiptKey) {
      return true;
    }
    return (
      !payment.buyerReceiptKey.endsWith('.pdf') || !payment.sellerReceiptKey.endsWith('.pdf')
    );
  }

  private async assertReceiptAccess(
    paymentId: string,
    userId: string,
    role: 'buyer' | 'seller',
  ) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.status !== 'succeeded') {
      throw new BadRequestException('Receipt is only available for successful payments');
    }
    if (role === 'buyer' && payment.buyerId !== userId) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    if (role === 'seller' && payment.sellerId !== userId) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    if (this.needsReceiptGeneration(payment)) {
      await this.generateForPayment(paymentId);
      const refreshed = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      const key = role === 'buyer' ? refreshed?.buyerReceiptKey : refreshed?.sellerReceiptKey;
      if (!key) {
        throw new NotFoundException('Receipt not available yet');
      }
      return refreshed!;
    }
    return payment;
  }

  private async readReceiptFile(key: string | null, filename: string) {
    if (!key) throw new NotFoundException('Receipt not found');
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
    payment: {
      id: string;
      amount: { toString(): string };
      platformFee: { toString(): string } | null;
      feePercentApplied: { toString(): string } | null;
      currency: string;
      method: string;
      providerPaymentId: string | null;
      listingId: string;
      listing: { title: string; locationLabel: string | null };
      buyer: { email: string; displayName: string | null; profile: { businessName: string | null } | null };
      seller: { email: string; displayName: string | null; profile: { businessName: string | null } | null };
    },
    receiptNumber: string,
    issuedAt: string,
  ): PaymentReceiptDocumentData {
    const grossAmount = Number(payment.amount);
    const platformFee = Number(payment.platformFee ?? 0);
    return {
      receiptNumber,
      paymentId: payment.id,
      issuedAt,
      currency: payment.currency,
      grossAmount,
      platformFee,
      netAmount: grossAmount - platformFee,
      feePercentApplied: payment.feePercentApplied ? Number(payment.feePercentApplied) : undefined,
      paymentMethod: this.formatMethod(payment.method),
      providerReference: payment.providerPaymentId ?? undefined,
      listingId: payment.listingId,
      listingTitle: payment.listing.title,
      listingLocation: payment.listing.locationLabel ?? undefined,
      buyerName: payment.buyer.profile?.businessName ?? payment.buyer.displayName ?? payment.buyer.email,
      buyerEmail: payment.buyer.email,
      sellerName: payment.seller.profile?.businessName ?? payment.seller.displayName ?? payment.seller.email,
      sellerEmail: payment.seller.email,
      webAppUrl: process.env.WEB_APP_URL ?? 'https://sellnearby.ie',
    };
  }

  private formatMethod(method: string): string {
    switch (method) {
      case 'card':
        return 'Card';
      case 'wallet':
        return 'Wallet';
      case 'bank_transfer':
        return 'Bank transfer';
      default:
        return method;
    }
  }
}
