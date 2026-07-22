import type PDFKit from 'pdfkit';

import type { InvoiceCompanyConfig } from '@community-marketplace/config';
import {
  buildDocumentFooterLegal,
  getInvoiceCompanyConfig,
  resolveDocumentWebsite,
} from '@community-marketplace/config';

import { resolveInvoiceBrandAssetPath } from './brand-assets';
import { getPdfCompany, PDF_MARGIN, PDF_PAGE, PDF_RGB } from './document-pdf.theme';
import { ensurePageSpace, PDF_CONTENT_TOP } from './pdf-page.util';

export type DocumentKind = 'RECEIPT' | 'INVOICE' | 'SALES RECORD' | 'STATEMENT' | 'REPORT';

export type DocumentFooterKind =
  | 'platform_invoice'
  | 'platform_revenue_report'
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
  const website = resolveDocumentWebsite(company);
  const headerHeight = 92;
  doc.save();
  doc.rect(0, 0, PDF_PAGE.width, headerHeight).fillColor(PDF_RGB.primaryDark).fill();

  const logoPath = resolveInvoiceBrandAssetPath(company.logoHeaderFile, company);
  if (logoPath) {
    doc.image(logoPath, PDF_MARGIN, 22, { width: 148 });
  } else {
    doc
      .fillColor(PDF_RGB.white)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(company.displayName, PDF_MARGIN, 26, { lineBreak: false });
  }

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor([220, 245, 240])
    .text(`${company.supportEmail}  ·  ${website}`, PDF_MARGIN, 68, {
      width: PDF_PAGE.width * 0.52,
      lineBreak: false,
      ellipsis: true,
    });

  const rightW = 200;
  const rightX = PDF_PAGE.width - PDF_MARGIN - rightW;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(PDF_RGB.white)
    .text(kind, rightX, 28, {
      width: rightW,
      align: 'right',
      characterSpacing: 0.8,
      lineBreak: false,
    });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor([220, 245, 240])
    .text(documentNumber, rightX, 46, {
      width: rightW,
      align: 'right',
      lineBreak: false,
      ellipsis: true,
    });

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
  const website = resolveDocumentWebsite(company);
  const boxW = PDF_PAGE.width - PDF_MARGIN * 2;
  const leftW = boxW * 0.58;
  const rightX = PDF_MARGIN + leftW + 12;
  const rightW = boxW - leftW - 26;
  const stripH = 58;

  doc.roundedRect(PDF_MARGIN, y, boxW, stripH, 4).fillColor(PDF_RGB.surface).fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text('SUPPLIER', PDF_MARGIN + 14, y + 10, { characterSpacing: 0.6, lineBreak: false });
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(PDF_RGB.text)
    .text(company.displayName, PDF_MARGIN + 14, y + 24, {
      width: leftW - 20,
      lineBreak: false,
      ellipsis: true,
    });

  const addressLine =
    company.vatStatus === 'registered' && company.vatNumber
      ? `${company.formattedAddress} · VAT ${company.vatNumber}`
      : company.formattedAddress;
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.muted)
    .text(addressLine, PDF_MARGIN + 14, y + 40, {
      width: leftW - 20,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text('CONTACT', rightX, y + 10, { characterSpacing: 0.6, lineBreak: false });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.text)
    .text(company.supportEmail, rightX, y + 24, {
      width: rightW,
      lineBreak: false,
      ellipsis: true,
    });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.muted)
    .text(website, rightX, y + 40, {
      width: rightW,
      lineBreak: false,
      ellipsis: true,
    });

  return y + stripH + 8;
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
  const blockLines = Math.max(left.lines.length, right.lines.length);
  const blockH = 16 + blockLines * 34;
  y = ensurePageSpace(doc, y, blockH + 8);

  const drawBlock = (x: number, block: PdfMetaBlock) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(PDF_RGB.muted)
      .text(block.title.toUpperCase(), x, y, { characterSpacing: 0.8, lineBreak: false });
    let lineY = y + 16;
    for (const line of block.lines) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(PDF_RGB.muted)
        .text(line.label, x, lineY, { width: colWidth, lineBreak: false, ellipsis: true });
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(PDF_RGB.text)
        .text(line.value, x, lineY + 11, {
          width: colWidth,
          lineBreak: false,
          ellipsis: true,
        });
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
  pageLabel?: string,
): void {
  const company = getPdfCompany(config);
  const contentW = PDF_PAGE.width - PDF_MARGIN * 2;
  const footerTop = PDF_PAGE.height - 48;
  const pageLineY = PDF_PAGE.height - 16;

  doc
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.5)
    .moveTo(PDF_MARGIN, footerTop)
    .lineTo(PDF_PAGE.width - PDF_MARGIN, footerTop)
    .stroke();

  const legal = buildDocumentFooterLegal(footerKind, company);
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(PDF_RGB.footer)
    .text(legal, PDF_MARGIN, footerTop + 8, {
      width: contentW,
      align: 'left',
      lineBreak: false,
      ellipsis: true,
    });

  if (pageLabel) {
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(PDF_RGB.footer)
      .text(pageLabel, PDF_MARGIN, pageLineY, {
        width: contentW,
        align: 'right',
        lineBreak: false,
      });
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
    const pageLabel = `${documentNumber} · Page ${i + 1} of ${total}`;
    drawEnterpriseFooter(doc, footerKind, company, pageLabel);
  }
}
