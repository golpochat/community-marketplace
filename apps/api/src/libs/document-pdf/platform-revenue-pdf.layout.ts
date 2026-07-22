import type PDFKit from 'pdfkit';

import {
  buildPlatformRevenueReportNote,
  formatInvoiceMoney,
  getInvoiceCompanyConfig,
  type InvoiceCompanyConfig,
} from '@community-marketplace/config';

import {
  attachEnterpriseDocumentFooters,
  drawEnterpriseHeader,
  drawMetaColumns,
  drawNoteBox,
  drawSupplierStrip,
} from './enterprise-pdf.layout';
import { PDF_MARGIN, PDF_PAGE, PDF_RGB } from './document-pdf.theme';
import {
  drawContinuationHeader,
  ensurePageSpace,
  PDF_CONTENT_TOP,
} from './pdf-page.util';
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
  let y = drawEnterpriseHeader(doc, 'REPORT', data.reportNumber) + 20;
  y = drawSupplierStrip(doc, y);

  y = drawMetaColumns(
    doc,
    y,
    {
      title: 'Prepared for',
      lines: [
        { label: 'Entity', value: company.legalName },
        { label: 'Purpose', value: 'Internal accountancy & VAT reporting' },
      ],
    },
    {
      title: 'Report details',
      lines: [
        { label: 'Period', value: data.periodLabel },
        { label: 'Issued', value: formatReceiptDate(data.issuedAt) },
      ],
    },
  );

  if (data.isPartialPeriod) {
    y = ensurePageSpace(doc, y, 20);
    doc
      .font('Helvetica-Oblique')
      .fontSize(8.5)
      .fillColor(PDF_RGB.muted)
      .text(
        `Activity to ${formatReceiptDate(data.issuedAt)} — reporting period not yet complete.`,
        PDF_MARGIN,
        y,
        {
          width: PDF_PAGE.width - PDF_MARGIN * 2,
          lineBreak: false,
          ellipsis: true,
        },
      );
    y += 18;
  }

  y = drawExecutiveSummary(doc, data, company, y);

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

  y = ensurePageSpace(doc, y, 20);
  drawNoteBox(doc, y, buildPlatformRevenueReportNote(company));
}

export function attachPlatformRevenueFooters(
  doc: PDFKit.PDFDocument,
  reportNumber: string,
): void {
  attachEnterpriseDocumentFooters(
    doc,
    'platform_revenue_report',
    reportNumber,
    getInvoiceCompanyConfig(),
  );
}

function drawExecutiveSummary(
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

  const contentLines = lines.filter((line) => line.label || line.value).length;
  const panelHeight = 28 + contentLines * 18 + 16;
  const titleH = 22;
  let y = ensurePageSpace(doc, startY, titleH + panelHeight + SECTION_GAP);
  y = drawSectionTitlePlain(doc, 'Executive summary', y);

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
      .text(line.label, panelX + 14, innerY, {
        width: panelW * 0.58,
        lineBreak: false,
        ellipsis: true,
      });
    doc.text(line.value, panelX + 14, innerY, {
      width: panelW - 28,
      align: 'right',
      lineBreak: false,
    });
    innerY += line.emphasis ? 20 : 18;
  }

  return y + panelHeight + SECTION_GAP;
}

function beginContinuedTable(
  doc: PDFKit.PDFDocument,
  title: string,
  cols: ColDef[],
): number {
  let y = drawContinuationHeader(doc, title);
  return drawTableHeader(doc, cols, y);
}

function drawPlatformServicesSection(
  doc: PDFKit.PDFDocument,
  rows: FinanceRecordLine[],
  startY: number,
): number {
  const cols: ColDef[] = [
    { label: 'DATE', width: 62 },
    { label: 'REFERENCE', width: 88 },
    { label: 'CUSTOMER', width: 118 },
    { label: 'SERVICE', width: 148 },
    { label: 'AMOUNT', width: 58, align: 'right' },
  ];

  const introH = 48 + (rows.length === 0 ? 24 : 22);
  let y = ensurePageSpace(doc, startY, introH + (rows.length === 0 ? 0 : ROW_H), () => PDF_CONTENT_TOP);
  y = drawSectionTitle(
    doc,
    y,
    'A. Platform services',
    'Direct invoices for SellNearby packages (featured listings, boosts, verification, etc.).',
  );

  if (rows.length === 0) {
    return drawEmptySection(doc, y, 'No platform service invoices in this period.');
  }

  y = drawTableHeader(doc, cols, y);
  for (const row of rows) {
    y = ensurePageSpace(doc, y, ROW_H, () => beginContinuedTable(doc, 'A. Platform services', cols));
    y = drawRevenueRow(doc, cols, row, y);
  }
  return y + SECTION_GAP;
}

function drawMarketplaceFeesSection(
  doc: PDFKit.PDFDocument,
  rows: FinanceRecordLine[],
  startY: number,
): number {
  const cols: ColDef[] = [
    { label: 'DATE', width: 62 },
    { label: 'REFERENCE', width: 88 },
    { label: 'SELLER', width: 118 },
    { label: 'LISTING', width: 148 },
    { label: 'FEE', width: 58, align: 'right' },
  ];

  const introH = 48 + (rows.length === 0 ? 24 : 22);
  let y = ensurePageSpace(doc, startY, introH + (rows.length === 0 ? 0 : ROW_H), () => PDF_CONTENT_TOP);
  y = drawSectionTitle(
    doc,
    y,
    'B. Marketplace fees',
    'Commission earned on completed listing sales.',
  );

  if (rows.length === 0) {
    return drawEmptySection(doc, y, 'No marketplace fees in this period.');
  }

  y = drawTableHeader(doc, cols, y);
  for (const row of rows) {
    y = ensurePageSpace(doc, y, ROW_H, () => beginContinuedTable(doc, 'B. Marketplace fees', cols));
    y = drawRevenueRow(doc, cols, row, y);
  }
  return y + SECTION_GAP;
}

function drawActivitySection(
  doc: PDFKit.PDFDocument,
  rows: FinanceRecordLine[],
  startY: number,
): number {
  const cols: ColDef[] = [
    { label: 'DATE', width: 58 },
    { label: 'TYPE', width: 52 },
    { label: 'REFERENCE', width: 78 },
    { label: 'PARTY', width: 108 },
    { label: 'LISTING', width: 118 },
    { label: 'AMOUNT', width: 58, align: 'right' },
  ];

  let y = ensurePageSpace(doc, startY, 48 + 22 + ROW_H, () => PDF_CONTENT_TOP);
  y = drawSectionTitle(
    doc,
    y,
    'C. Marketplace activity',
    'Informational trade volume between buyers and sellers — not platform income.',
  );

  y = drawTableHeader(doc, cols, y);
  for (const row of rows) {
    y = ensurePageSpace(doc, y, ROW_H, () =>
      beginContinuedTable(doc, 'C. Marketplace activity', cols),
    );
    y = drawActivityRow(doc, cols, row, y);
  }
  return y + SECTION_GAP;
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  y: number,
  title: string,
  subtitle: string,
): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(PDF_RGB.primaryDark)
    .text(title, PDF_MARGIN, y, { lineBreak: false });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.muted)
    .text(subtitle, PDF_MARGIN, y + 14, {
      width: PDF_PAGE.width - PDF_MARGIN * 2,
      lineBreak: false,
      ellipsis: true,
    });
  return y + 32;
}

function drawSectionTitlePlain(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(PDF_RGB.primaryDark)
    .text(title, PDF_MARGIN, y, { lineBreak: false });
  return y + 22;
}

function drawEmptySection(doc: PDFKit.PDFDocument, y: number, message: string): number {
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(PDF_RGB.muted)
    .text(message, PDF_MARGIN, y, {
      width: PDF_PAGE.width - PDF_MARGIN * 2,
      lineBreak: false,
      ellipsis: true,
    });
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
