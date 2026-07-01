import type { PaymentReceiptDocumentData } from '../../modules/payments/lib/payment-receipt.types';
import { formatReceiptDate, formatReceiptMoney } from '../../modules/payments/lib/payment-receipt.types';
import type { PlatformPurchaseInvoiceData } from '../../modules/monetization/lib/platform-purchase-invoice.types';
import {
  buildBuyerReceiptNote,
  buildPlatformInvoiceNote,
  buildPlatformInvoiceTotals,
  buildSellerSalesRecordNote,
  getInvoiceCompanyConfig,
} from '@community-marketplace/config';

import {
  attachEnterpriseDocumentFooters,
  drawEnterpriseHeader,
  drawLineItemsTable,
  drawMetaColumns,
  drawNoteBox,
  drawPaidBadge,
  drawSupplierStrip,
  drawTotalsPanel,
} from './enterprise-pdf.layout';
import { renderPdf } from './pdf-buffer.util';

function renderFinancialDocument(
  render: (doc: PDFKit.PDFDocument) => void,
  footerKind: 'platform_invoice' | 'buyer_receipt' | 'seller_sales_record',
  documentNumber: string,
): Promise<Buffer> {
  const company = getInvoiceCompanyConfig();
  return renderPdf((doc) => {
    render(doc);
    attachEnterpriseDocumentFooters(doc, footerKind, documentNumber, company);
  });
}

export function buildBuyerReceiptPdf(data: PaymentReceiptDocumentData): Promise<Buffer> {
  return renderFinancialDocument((doc) => {
    let y = drawEnterpriseHeader(doc, 'RECEIPT', data.receiptNumber) + 20;
    y = drawSupplierStrip(doc, y);
    y = drawPaidBadge(doc, y);

    y = drawMetaColumns(
      doc,
      y,
      {
        title: 'Bill to',
        lines: [
          { label: 'Buyer', value: data.buyerName },
          { label: 'Email', value: data.buyerEmail },
        ],
      },
      {
        title: 'Document details',
        lines: [
          { label: 'Issue date', value: formatReceiptDate(data.issuedAt) },
          { label: 'Payment method', value: data.paymentMethod },
          ...(data.providerReference
            ? [{ label: 'Reference', value: data.providerReference }]
            : []),
        ],
      },
    );

    y = drawLineItemsTable(
      doc,
      y,
      [
        {
          description: data.listingTitle,
          detail: data.listingLocation
            ? `Listing · ${data.listingLocation}`
            : `Listing ID ${data.listingId}`,
          amount: formatReceiptMoney(data.grossAmount, data.currency),
        },
        {
          description: `Seller: ${data.sellerName}`,
          detail: data.sellerEmail,
          amount: '—',
        },
      ],
      { continuationTitle: 'Receipt items' },
    );

    y = drawTotalsPanel(doc, y, [
      { label: 'Subtotal', value: formatReceiptMoney(data.grossAmount, data.currency) },
      {
        label: 'Total paid',
        value: formatReceiptMoney(data.grossAmount, data.currency),
        emphasis: true,
      },
    ]);

    drawNoteBox(doc, y, buildBuyerReceiptNote(getInvoiceCompanyConfig()));
  }, 'buyer_receipt', data.receiptNumber);
}

export function buildSellerSalesRecordPdf(data: PaymentReceiptDocumentData): Promise<Buffer> {
  return renderFinancialDocument((doc) => {
    let y = drawEnterpriseHeader(doc, 'SALES RECORD', data.receiptNumber) + 20;
    y = drawSupplierStrip(doc, y);
    y = drawPaidBadge(doc, y);

    y = drawMetaColumns(
      doc,
      y,
      {
        title: 'Seller',
        lines: [
          { label: 'Name', value: data.sellerName },
          { label: 'Email', value: data.sellerEmail },
        ],
      },
      {
        title: 'Transaction',
        lines: [
          { label: 'Issue date', value: formatReceiptDate(data.issuedAt) },
          { label: 'Buyer', value: data.buyerName },
          ...(data.providerReference
            ? [{ label: 'Reference', value: data.providerReference }]
            : []),
        ],
      },
    );

    y = drawLineItemsTable(
      doc,
      y,
      [
        {
          description: data.listingTitle,
          detail: `Listing ID ${data.listingId}`,
          amount: formatReceiptMoney(data.grossAmount, data.currency),
        },
        {
          description: 'Platform fee',
          detail:
            data.feePercentApplied != null
              ? `${data.feePercentApplied}% marketplace fee`
              : 'Marketplace fee',
          amount: formatReceiptMoney(data.platformFee, data.currency),
        },
      ],
      { continuationTitle: 'Sales record' },
    );

    y = drawTotalsPanel(doc, y, [
      { label: 'Gross sale', value: formatReceiptMoney(data.grossAmount, data.currency) },
      {
        label: 'Platform fee',
        value:
          data.platformFee > 0
            ? `(${formatReceiptMoney(data.platformFee, data.currency)})`
            : formatReceiptMoney(0, data.currency),
      },
      {
        label: 'Net to seller',
        value: formatReceiptMoney(data.netAmount, data.currency),
        emphasis: true,
      },
    ]);

    drawNoteBox(doc, y, buildSellerSalesRecordNote(getInvoiceCompanyConfig()));
  }, 'seller_sales_record', data.receiptNumber);
}

export function buildPlatformPurchaseInvoicePdf(data: PlatformPurchaseInvoiceData): Promise<Buffer> {
  return renderFinancialDocument((doc) => {
    let y = drawEnterpriseHeader(doc, 'INVOICE', data.invoiceNumber) + 20;
    y = drawSupplierStrip(doc, y);
    y = drawPaidBadge(doc, y);

    y = drawMetaColumns(
      doc,
      y,
      {
        title: 'Billed to',
        lines: [
          { label: 'Customer', value: data.customerName },
          { label: 'Email', value: data.customerEmail },
        ],
      },
      {
        title: 'Invoice details',
        lines: [
          { label: 'Issue date', value: formatReceiptDate(data.issuedAt) },
          { label: 'Service type', value: data.purchaseLabel },
          ...(data.providerReference
            ? [{ label: 'Payment reference', value: data.providerReference }]
            : []),
        ],
      },
    );

    y = drawLineItemsTable(
      doc,
      y,
      [
        {
          description: data.purchaseLabel,
          detail: data.listingTitle
            ? `${data.purchaseDescription} · ${data.listingTitle}`
            : data.purchaseDescription,
          amount: formatReceiptMoney(data.amount, data.currency),
        },
      ],
      { continuationTitle: 'Invoice items' },
    );

    y = drawTotalsPanel(doc, y, buildPlatformInvoiceTotals(data.amount, data.currency, getInvoiceCompanyConfig()));
    drawNoteBox(doc, y, buildPlatformInvoiceNote(getInvoiceCompanyConfig()));
  }, 'platform_invoice', data.invoiceNumber);
}
