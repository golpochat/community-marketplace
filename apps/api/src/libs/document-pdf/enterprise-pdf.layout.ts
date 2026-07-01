import type PDFKit from 'pdfkit';

import type { InvoiceCompanyConfig } from '@community-marketplace/config';
import {
  buildDocumentFooterLegal,
  getInvoiceCompanyConfig,
  resolveDocumentWebsite,
  splitFooterLegalSentences,
} from '@community-marketplace/config';

import { resolveInvoiceBrandAssetPath } from './brand-assets';
import { getPdfCompany, PDF_MARGIN, PDF_PAGE, PDF_RGB } from './document-pdf.theme';
import { ensurePageSpace, PDF_CONTENT_TOP } from './pdf-page.util';

export type DocumentKind = 'RECEIPT' | 'INVOICE' | 'SALES RECORD' | 'STATEMENT';

export type DocumentFooterKind =
  | 'platform_invoice'
  | 'buyer_receipt'
  | 'seller_sales_record'
  | 'statement';

export interface PdfMetaBlock {
  title: string;
  lines: Array<{ label: string; value: string }>;
}

export interface PdfLineItem {
  description: string;
  detail?: string;
  amount: string;
}

export interface PdfTotalLine {
  label: string;
  value: string;
  emphasis?: boolean;
}

export function drawEnterpriseHeader(
  doc: PDFKit.PDFDocument,
  kind: DocumentKind,
  documentNumber: string,
  config?: InvoiceCompanyConfig,
): number {
  const company = getPdfCompany(config);
  const headerHeight = 100;
  doc.save();
  doc.rect(0, 0, PDF_PAGE.width, headerHeight).fillColor(PDF_RGB.primaryDark).fill();

  const logoPath = resolveInvoiceBrandAssetPath(company.logoHeaderFile, company);
  if (logoPath) {
    doc.image(logoPath, PDF_MARGIN, 30, { width: 148 });
  } else {
    doc
      .fillColor(PDF_RGB.white)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(company.displayName, PDF_MARGIN, 38, { lineBreak: false });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor([220, 245, 240])
      .text('Community marketplace', PDF_MARGIN, 62, { lineBreak: false });
  }

  const badgeWidth = 128;
  const badgeX = PDF_PAGE.width - PDF_MARGIN - badgeWidth;
  doc.roundedRect(badgeX, 28, badgeWidth, 44, 6).fillColor([255, 255, 255, 0.12]).fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_RGB.white)
    .text(kind, badgeX, 40, { width: badgeWidth, align: 'center', characterSpacing: 0.6 });
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor([220, 245, 240])
    .text(documentNumber, badgeX, 56, { width: badgeWidth, align: 'center' });

  doc.restore();
  doc.rect(0, headerHeight, PDF_PAGE.width, 3).fillColor(PDF_RGB.accent).fill();

  return headerHeight + 3;
}

export function drawSupplierStrip(
  doc: PDFKit.PDFDocument,
  y: number,
  config?: InvoiceCompanyConfig,
): number {
  const company = getPdfCompany(config);
  const boxW = PDF_PAGE.width - PDF_MARGIN * 2;
  doc.roundedRect(PDF_MARGIN, y, boxW, 52, 4).fillColor(PDF_RGB.surface).fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text('SUPPLIER', PDF_MARGIN + 14, y + 10, { characterSpacing: 0.6 });
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(PDF_RGB.text)
    .text(company.displayName, PDF_MARGIN + 14, y + 24);
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.muted)
    .text(company.formattedAddress, PDF_MARGIN + 14, y + 38, { width: boxW - 28 });

  if (company.vatStatus === 'registered' && company.vatNumber) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(PDF_RGB.primaryDark)
      .text(`VAT: ${company.vatNumber}`, PDF_PAGE.width - PDF_MARGIN - 14, y + 24, {
        width: 160,
        align: 'right',
      });
  }

  return y + 60;
}

export function drawPaidBadge(doc: PDFKit.PDFDocument, y: number): number {
  const badgeW = 62;
  const badgeH = 22;
  const x = PDF_PAGE.width - PDF_MARGIN - badgeW;
  doc.roundedRect(x, y, badgeW, badgeH, 4).fillColor(PDF_RGB.paidGreenBg).fill();
  doc
    .strokeColor(PDF_RGB.paidGreen)
    .lineWidth(0.75)
    .roundedRect(x, y, badgeW, badgeH, 4)
    .stroke();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_RGB.paidGreen)
    .text('PAID', x, y + 6, { width: badgeW, align: 'center' });
  return y + badgeH + 12;
}

export function drawMetaColumns(
  doc: PDFKit.PDFDocument,
  y: number,
  left: PdfMetaBlock,
  right: PdfMetaBlock,
): number {
  const colWidth = (PDF_PAGE.width - PDF_MARGIN * 2 - 24) / 2;
  const leftX = PDF_MARGIN;
  const rightX = PDF_MARGIN + colWidth + 24;

  const drawBlock = (x: number, block: PdfMetaBlock) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(PDF_RGB.muted)
      .text(block.title.toUpperCase(), x, y, { characterSpacing: 0.8 });
    let lineY = y + 16;
    for (const line of block.lines) {
      doc.font('Helvetica').fontSize(8).fillColor(PDF_RGB.muted).text(line.label, x, lineY);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(PDF_RGB.text)
        .text(line.value, x, lineY + 11, { width: colWidth });
      lineY += 34;
    }
    return lineY;
  };

  const leftEnd = drawBlock(leftX, left);
  const rightEnd = drawBlock(rightX, right);
  return Math.max(leftEnd, rightEnd) + 8;
}

export function drawLineItemsTable(
  doc: PDFKit.PDFDocument,
  y: number,
  items: PdfLineItem[],
  options?: { continuationTitle?: string },
): number {
  const tableX = PDF_MARGIN;
  const tableW = PDF_PAGE.width - PDF_MARGIN * 2;
  const descW = tableW * 0.68;
  const amountW = tableW - descW;
  const headerH = 28;
  const continuationTitle = options?.continuationTitle ?? 'Line items';

  const drawHeader = (startY: number) => {
    doc.roundedRect(tableX, startY, tableW, headerH, 4).fillColor(PDF_RGB.surface).fill();
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(PDF_RGB.muted)
      .text('DESCRIPTION', tableX + 14, startY + 10, { characterSpacing: 0.6 });
    doc.text('AMOUNT', tableX + descW, startY + 10, {
      width: amountW - 14,
      align: 'right',
      characterSpacing: 0.6,
    });
    return startY + headerH;
  };

  y = ensurePageSpace(doc, y, headerH + ROW_MIN_HEIGHT, () => {
    let ny = drawContinuationHeader(doc, continuationTitle);
    return drawHeader(ny);
  });
  let rowY = drawHeader(y);

  for (const item of items) {
    const rowH = item.detail ? 44 : 32;
    rowY = ensurePageSpace(doc, rowY, rowH + 8, () => {
      let ny = drawContinuationHeader(doc, continuationTitle);
      ny = drawHeader(ny);
      return ny;
    });

    doc
      .strokeColor(PDF_RGB.border)
      .lineWidth(0.5)
      .moveTo(tableX, rowY)
      .lineTo(tableX + tableW, rowY)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(PDF_RGB.text)
      .text(item.description, tableX + 14, rowY + 10, { width: descW - 20 });
    if (item.detail) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(PDF_RGB.muted)
        .text(item.detail, tableX + 14, rowY + 24, { width: descW - 20 });
    }
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(PDF_RGB.text)
      .text(item.amount, tableX + descW, rowY + (item.detail ? 16 : 10), {
        width: amountW - 14,
        align: 'right',
      });

    rowY += rowH;
  }

  doc
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.5)
    .moveTo(tableX, rowY)
    .lineTo(tableX + tableW, rowY)
    .stroke();

  return rowY + 16;
}

const ROW_MIN_HEIGHT = 32;

function drawContinuationHeader(doc: PDFKit.PDFDocument, title: string): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_RGB.muted)
    .text(`${title} (continued)`, PDF_MARGIN, PDF_CONTENT_TOP, { lineBreak: false });
  return PDF_CONTENT_TOP + 18;
}

export function drawNoteBox(doc: PDFKit.PDFDocument, y: number, text: string): number {
  const boxW = PDF_PAGE.width - PDF_MARGIN * 2;
  const pad = 14;
  doc.font('Helvetica').fontSize(8.5);
  const textHeight = doc.heightOfString(text, { width: boxW - pad * 2, lineGap: 2 });
  const height = Math.max(56, textHeight + pad * 2);
  y = ensurePageSpace(doc, y, height + 12);
  doc.roundedRect(PDF_MARGIN, y, boxW, height, 6).fillColor(PDF_RGB.surface).fill();
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.muted)
    .text(text, PDF_MARGIN + pad, y + pad, { width: boxW - pad * 2, lineGap: 2 });
  return y + height + 12;
}

export function drawTotalsPanel(
  doc: PDFKit.PDFDocument,
  y: number,
  lines: PdfTotalLine[],
): number {
  const panelW = 250;
  const panelPad = 14;
  const lineH = 22;
  const panelH = panelPad * 2 + lines.length * lineH;
  y = ensurePageSpace(doc, y, panelH + 20);

  const panelX = PDF_PAGE.width - PDF_MARGIN - panelW;
  doc.roundedRect(panelX, y, panelW, panelH, 6).fillColor(PDF_RGB.surface).fill();
  doc
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.75)
    .roundedRect(panelX, y, panelW, panelH, 6)
    .stroke();

  let lineY = y + panelPad;
  for (const line of lines) {
    const isEmphasis = line.emphasis === true;
    const rowH = isEmphasis ? 26 : lineH;
    doc
      .font(isEmphasis ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isEmphasis ? 11 : 9)
      .fillColor(isEmphasis ? PDF_RGB.primaryDark : PDF_RGB.muted)
      .text(line.label, panelX + panelPad, lineY, {
        width: panelW - panelPad * 2,
        lineBreak: false,
      });
    doc
      .font(isEmphasis ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isEmphasis ? 13 : 9)
      .fillColor(isEmphasis ? PDF_RGB.primaryDark : PDF_RGB.text)
      .text(line.value, panelX + panelPad, lineY, {
        width: panelW - panelPad * 2,
        align: 'right',
        lineBreak: false,
      });
    lineY += rowH;
  }

  return y + panelH + 20;
}

export function drawEnterpriseFooter(
  doc: PDFKit.PDFDocument,
  footerKind: DocumentFooterKind,
  config?: InvoiceCompanyConfig,
  documentNumber?: string,
): void {
  const company = getPdfCompany(config);
  const footerY = PDF_PAGE.height - 88;
  const contentW = PDF_PAGE.width - PDF_MARGIN * 2;

  doc
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.5)
    .moveTo(PDF_MARGIN, footerY)
    .lineTo(PDF_PAGE.width - PDF_MARGIN, footerY)
    .stroke();

  const footerLogo = resolveInvoiceBrandAssetPath(company.logoFooterFile, company);
  if (footerLogo) {
    doc.image(footerLogo, PDF_MARGIN, footerY + 10, { width: 96 });
  } else {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(PDF_RGB.text)
      .text(company.displayName, PDF_MARGIN, footerY + 14);
  }

  const website = resolveDocumentWebsite(company);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text(company.supportEmail, PDF_MARGIN, footerY + 34);
  doc.font('Helvetica').fontSize(8).fillColor(PDF_RGB.muted).text(website, PDF_MARGIN, footerY + 46);

  const legalParts = splitFooterLegalSentences(buildDocumentFooterLegal(footerKind, company));
  let legalY = footerY + 8;
  for (const sentence of legalParts) {
    doc.font('Helvetica').fontSize(6.75).fillColor(PDF_RGB.footer);
    const blockH = doc.heightOfString(sentence, { width: contentW - 120, lineGap: 1.2 });
    doc.text(sentence, PDF_MARGIN + 120, legalY, { width: contentW - 120, lineGap: 1.2 });
    legalY += blockH + 4;
  }

  if (documentNumber) {
    doc
      .font('Helvetica')
      .fontSize(6)
      .fillColor(PDF_RGB.footer)
      .text(documentNumber, PDF_MARGIN, PDF_PAGE.height - 18, { width: contentW, align: 'right' });
  }
}

export function attachEnterpriseDocumentFooters(
  doc: PDFKit.PDFDocument,
  footerKind: DocumentFooterKind,
  documentNumber: string,
  config?: InvoiceCompanyConfig,
): void {
  const company = config ?? getInvoiceCompanyConfig();
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = range.start; i < range.start + total; i++) {
    doc.switchToPage(i);
    const label =
      total > 1
        ? `${documentNumber} · Page ${i + 1} of ${total}`
        : documentNumber;
    drawEnterpriseFooter(doc, footerKind, company, label);
  }
}
