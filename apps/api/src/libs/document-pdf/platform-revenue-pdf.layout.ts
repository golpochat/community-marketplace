import type PDFKit from 'pdfkit';

import type { InvoiceCompanyConfig } from '@community-marketplace/config';
import {
  buildPlatformRevenueReportNote,
  formatInvoiceMoney,
  getInvoiceCompanyConfig,
  splitFooterLegalSentences,
  buildDocumentFooterLegal,
} from '@community-marketplace/config';

import { resolveInvoiceBrandAssetPath } from './brand-assets';
import { getPdfCompany, PDF_MARGIN, PDF_PAGE, PDF_RGB } from './document-pdf.theme';
import {
  drawContinuationHeader,
  drawPageBackground,
  ensurePageSpace,
  PDF_CONTENT_TOP,
  PDF_FOOTER_RESERVE,
} from './pdf-page.util';
import { formatStatementPeriodRange } from '../../modules/statements/lib/account-statement.types';
import type { FinanceRecordLine } from '../../modules/statements/lib/finance-records.util';
import type { PlatformRevenueReportData } from '../../modules/statements/lib/platform-revenue-report.types';
import { formatReceiptDate } from '../../modules/payments/lib/payment-receipt.types';

const ROW_H = 40;
const SECTION_GAP = 20;

type ColDef = { label: string; width: number; align?: 'left' | 'right' };

function formatMoney(amount: number, currency: string): string {
  return formatInvoiceMoney(amount, currency);
}

function formatReportDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export function renderPlatformRevenueReport(
  doc: PDFKit.PDFDocument,
  data: PlatformRevenueReportData,
): void {
  const company = getInvoiceCompanyConfig();
  let y = drawCover(doc, data, company);

  const platformRows = data.records.filter((row) => row.type === 'platform_service');
  const feeRows = data.records.filter((row) => row.type === 'marketplace_fee');
  const activityRows = data.records.filter(
    (row) => row.type === 'buyer_purchase' || row.type === 'seller_sale',
  );

  y = drawPlatformServicesSection(doc, platformRows, y);
  y = drawMarketplaceFeesSection(doc, feeRows, y);
  if (activityRows.length > 0) {
    y = drawActivitySection(doc, activityRows, y);
  }
  y = drawSummary(doc, data, company, y);
  y = ensurePageSpace(doc, y, 72);
  drawNote(doc, company, y);
}

export function attachPlatformRevenueFooters(doc: PDFKit.PDFDocument, reportNumber: string): void {
  const company = getInvoiceCompanyConfig();
  const legal = splitFooterLegalSentences(
    buildDocumentFooterLegal('platform_revenue_report', company),
  );
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const footerY = PDF_PAGE.height - PDF_FOOTER_RESERVE + 12;
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(PDF_RGB.muted)
      .text(legal.join(' '), PDF_MARGIN, footerY, {
        width: PDF_PAGE.width - PDF_MARGIN * 2,
        align: 'center',
      });
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(PDF_RGB.muted)
      .text(`${reportNumber} · Page ${i + 1} of ${range.count}`, PDF_MARGIN, footerY + 28, {
        width: PDF_PAGE.width - PDF_MARGIN * 2,
        align: 'center',
      });
  }
}

function drawCover(
  doc: PDFKit.PDFDocument,
  data: PlatformRevenueReportData,
  config: InvoiceCompanyConfig,
): number {
  drawPageBackground(doc);
  const company = getPdfCompany(config);

  doc.rect(0, 0, PDF_PAGE.width, 6).fillColor(PDF_RGB.primary).fill();
  doc.rect(0, 6, PDF_PAGE.width, 3).fillColor(PDF_RGB.accent).fill();

  const logoPath = resolveInvoiceBrandAssetPath(company.logoFooterFile, company);
  let y = 28;
  if (logoPath) {
    doc.image(logoPath, PDF_MARGIN, y, { width: 120 });
    y += 38;
  } else {
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(PDF_RGB.primaryDark)
      .text(company.displayName, PDF_MARGIN, y);
    y += 28;
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(PDF_RGB.text)
    .text('Platform revenue report', PDF_MARGIN, y + 8);
  y += 36;

  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(PDF_RGB.muted)
    .text(formatStatementPeriodRange(periodStart, periodEnd), PDF_MARGIN, y);
  y += 16;

  if (data.isPartialPeriod) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(8.5)
      .fillColor(PDF_RGB.muted)
      .text(
        `Activity to ${formatReceiptDate(data.issuedAt)} — period not yet complete.`,
        PDF_MARGIN,
        y,
      );
    y += 18;
  }

  const boxW = PDF_PAGE.width - PDF_MARGIN * 2;
  doc.roundedRect(PDF_MARGIN, y, boxW, 88, 6).fillColor(PDF_RGB.white).fill();
  doc.strokeColor(PDF_RGB.border).lineWidth(0.75).roundedRect(PDF_MARGIN, y, boxW, 88, 6).stroke();

  const colW = (boxW - 28) / 2;
  const leftX = PDF_MARGIN + 14;
  const rightX = PDF_MARGIN + 14 + colW + 14;

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(PDF_RGB.muted)
    .text('PREPARED FOR', leftX, y + 12, { characterSpacing: 0.6 });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PDF_RGB.text).text(company.displayName, leftX, y + 24);
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.muted)
    .text('Internal accountancy & VAT reporting', leftX, y + 38);

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(PDF_RGB.muted)
    .text('REPORT DETAILS', rightX, y + 12, { characterSpacing: 0.6 });
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_RGB.muted).text('Reference', rightX, y + 24);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_RGB.text)
    .text(data.reportNumber, rightX, y + 34);
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_RGB.muted).text('Issued', rightX, y + 50);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_RGB.text)
    .text(formatReceiptDate(data.issuedAt), rightX, y + 60);

  return y + 88 + SECTION_GAP;
}

function drawPlatformServicesSection(
  doc: PDFKit.PDFDocument,
  rows: FinanceRecordLine[],
  startY: number,
): number {
  let y = drawSectionTitle(
    doc,
    startY,
    'A. Platform services',
    'Direct invoices for SellNearby packages (featured listings, boosts, verification, etc.).',
  );

  if (rows.length === 0) {
    return drawEmptySection(doc, y, 'No platform service invoices in this period.');
  }

  const cols: ColDef[] = [
    { label: 'DATE', width: 62 },
    { label: 'REFERENCE', width: 88 },
    { label: 'CUSTOMER', width: 118 },
    { label: 'SERVICE', width: 148 },
    { label: 'AMOUNT', width: 58, align: 'right' },
  ];

  y = drawTableHeader(doc, cols, y);
  for (const row of rows) {
    y = ensurePageSpace(doc, y, ROW_H, () => drawContinuationHeader(doc, 'A. Platform services'));
    y = drawRevenueRow(doc, cols, row, y);
  }
  return y + SECTION_GAP;
}

function drawMarketplaceFeesSection(
  doc: PDFKit.PDFDocument,
  rows: FinanceRecordLine[],
  startY: number,
): number {
  let y = drawSectionTitle(
    doc,
    startY,
    'B. Marketplace fees',
    'Commission earned on completed listing sales.',
  );

  if (rows.length === 0) {
    return drawEmptySection(doc, y, 'No marketplace fees in this period.');
  }

  const cols: ColDef[] = [
    { label: 'DATE', width: 62 },
    { label: 'REFERENCE', width: 88 },
    { label: 'SELLER', width: 118 },
    { label: 'LISTING', width: 148 },
    { label: 'FEE', width: 58, align: 'right' },
  ];

  y = drawTableHeader(doc, cols, y);
  for (const row of rows) {
    y = ensurePageSpace(doc, y, ROW_H, () => drawContinuationHeader(doc, 'B. Marketplace fees'));
    y = drawRevenueRow(doc, cols, row, y);
  }
  return y + SECTION_GAP;
}

function drawActivitySection(
  doc: PDFKit.PDFDocument,
  rows: FinanceRecordLine[],
  startY: number,
): number {
  let y = drawSectionTitle(
    doc,
    startY,
    'C. Marketplace activity',
    'Informational trade volume between buyers and sellers — not platform income.',
  );

  const cols: ColDef[] = [
    { label: 'DATE', width: 58 },
    { label: 'TYPE', width: 52 },
    { label: 'REFERENCE', width: 78 },
    { label: 'PARTY', width: 108 },
    { label: 'LISTING', width: 118 },
    { label: 'AMOUNT', width: 58, align: 'right' },
  ];

  y = drawTableHeader(doc, cols, y);
  for (const row of rows) {
    y = ensurePageSpace(doc, y, ROW_H, () => drawContinuationHeader(doc, 'C. Marketplace activity'));
    y = drawActivityRow(doc, cols, row, y);
  }
  return y + SECTION_GAP;
}

function drawSummary(
  doc: PDFKit.PDFDocument,
  data: PlatformRevenueReportData,
  config: InvoiceCompanyConfig,
  startY: number,
): number {
  const { summary } = data;
  const lines: { label: string; value: string; emphasis?: boolean; muted?: boolean }[] = [
    {
      label: `Platform services (${summary.platformInvoiceCount})`,
      value: formatMoney(summary.platformServicesGross, summary.currency),
    },
    {
      label: `Marketplace fees (${summary.marketplaceFeeCount})`,
      value: formatMoney(summary.marketplaceFeesGross, summary.currency),
    },
  ];

  if (summary.netAmount != null && summary.vatAmount != null) {
    lines.push(
      { label: 'Net (excl. VAT)', value: formatMoney(summary.netAmount, summary.currency) },
      {
        label: `VAT @ ${Math.round(config.defaultVatRate * 100)}%`,
        value: formatMoney(summary.vatAmount, summary.currency),
      },
    );
  }

  lines.push({
    label: 'Total platform revenue',
    value: formatMoney(summary.totalRevenueGross, summary.currency),
    emphasis: true,
  });

  if (summary.activityVolumeGross > 0) {
    lines.push(
      { label: '', value: '', muted: true },
      {
        label: `Buyer purchases (${summary.buyerPurchaseCount})`,
        value: formatMoney(summary.buyerPurchasesGross, summary.currency),
        muted: true,
      },
      {
        label: `Seller sales (${summary.sellerSaleCount})`,
        value: formatMoney(summary.sellerSalesGross, summary.currency),
        muted: true,
      },
      {
        label: 'Total activity volume (informational)',
        value: formatMoney(summary.activityVolumeGross, summary.currency),
        muted: true,
      },
    );
  }

  const panelHeight = 28 + lines.filter((line) => line.label || line.value).length * 18 + 16;
  let y = ensurePageSpace(doc, startY, panelHeight + 24);
  y = drawSectionTitlePlain(doc, 'Period summary', y);

  const panelX = PDF_MARGIN;
  const panelW = PDF_PAGE.width - PDF_MARGIN * 2;
  doc.roundedRect(panelX, y, panelW, panelHeight, 4).fillColor([248, 250, 252]).fill();
  doc.roundedRect(panelX, y, panelW, panelHeight, 4).strokeColor(PDF_RGB.border).lineWidth(0.5).stroke();

  let innerY = y + 14;
  for (const line of lines) {
    if (!line.label && !line.value) {
      innerY += 6;
      continue;
    }
    doc
      .font(line.emphasis ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(line.emphasis ? 10 : 9)
      .fillColor(line.muted ? PDF_RGB.muted : PDF_RGB.text)
      .text(line.label, panelX + 14, innerY, { width: panelW * 0.58 });
    doc.text(line.value, panelX + 14, innerY, {
      width: panelW - 28,
      align: 'right',
    });
    innerY += line.emphasis ? 20 : 18;
  }

  return y + panelHeight + SECTION_GAP;
}

function drawNote(doc: PDFKit.PDFDocument, config: InvoiceCompanyConfig, y: number): void {
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text(buildPlatformRevenueReportNote(config), PDF_MARGIN, y, {
      width: PDF_PAGE.width - PDF_MARGIN * 2,
      align: 'justify',
    });
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  y: number,
  title: string,
  subtitle: string,
): number {
  y = ensurePageSpace(doc, y, 48, () => PDF_CONTENT_TOP);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_RGB.primaryDark).text(title, PDF_MARGIN, y);
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_RGB.muted).text(subtitle, PDF_MARGIN, y + 14, {
    width: PDF_PAGE.width - PDF_MARGIN * 2,
  });
  return y + 32;
}

function drawSectionTitlePlain(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_RGB.primaryDark).text(title, PDF_MARGIN, y);
  return y + 22;
}

function drawEmptySection(doc: PDFKit.PDFDocument, y: number, message: string): number {
  doc.font('Helvetica').fontSize(9).fillColor(PDF_RGB.muted).text(message, PDF_MARGIN, y);
  return y + 24 + SECTION_GAP;
}

function drawTableHeader(doc: PDFKit.PDFDocument, cols: ColDef[], y: number): number {
  let x = PDF_MARGIN;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF_RGB.muted);
  for (const col of cols) {
    doc.text(col.label, x, y, { width: col.width, align: col.align ?? 'left', lineBreak: false });
    x += col.width + 6;
  }
  y += 14;
  doc
    .moveTo(PDF_MARGIN, y)
    .lineTo(PDF_PAGE.width - PDF_MARGIN, y)
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.5)
    .stroke();
  return y + 8;
}

function drawRevenueRow(
  doc: PDFKit.PDFDocument,
  cols: ColDef[],
  row: FinanceRecordLine,
  y: number,
): number {
  strokeRow(doc, y, PDF_PAGE.width - PDF_MARGIN * 2, ROW_H);

  let x = PDF_MARGIN + 4;
  const scalarValues = [
    formatReportDate(row.date),
    row.reference,
    null,
    row.description,
    formatMoney(row.amount, row.currency),
  ];

  for (let i = 0; i < cols.length; i += 1) {
    const col = cols[i]!;
    if (i === 2) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(PDF_RGB.text)
        .text(row.party, x, y + 10, { width: col.width - 4, lineBreak: false, ellipsis: true });
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(PDF_RGB.muted)
        .text(row.partyEmail, x, y + 24, { width: col.width - 4, lineBreak: false, ellipsis: true });
    } else {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(PDF_RGB.text)
        .text(scalarValues[i] ?? '', x, y + 14, {
          width: col.width - 4,
          align: col.align ?? 'left',
          lineBreak: false,
          ellipsis: true,
        });
    }
    x += col.width + 6;
  }

  return y + ROW_H;
}

function drawActivityRow(
  doc: PDFKit.PDFDocument,
  cols: ColDef[],
  row: FinanceRecordLine,
  y: number,
): number {
  strokeRow(doc, y, PDF_PAGE.width - PDF_MARGIN * 2, ROW_H);

  let x = PDF_MARGIN + 4;
  const values = [
    formatReportDate(row.date),
    row.typeLabel,
    row.reference,
    row.party,
    row.description,
    formatMoney(row.amount, row.currency),
  ];

  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_RGB.text);
  for (let i = 0; i < cols.length; i += 1) {
    const col = cols[i]!;
    doc.text(values[i] ?? '', x, y + 14, {
      width: col.width - 4,
      align: col.align ?? 'left',
      lineBreak: false,
      ellipsis: true,
    });
    x += col.width + 6;
  }

  return y + ROW_H;
}

function strokeRow(doc: PDFKit.PDFDocument, y: number, width: number, height: number): void {
  doc
    .moveTo(PDF_MARGIN, y + height)
    .lineTo(PDF_MARGIN + width, y + height)
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.25)
    .stroke();
}
