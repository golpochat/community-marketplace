import type PDFKit from 'pdfkit';

import type { InvoiceCompanyConfig } from '@community-marketplace/config';
import {
  buildDocumentFooterLegal,
  buildPlatformInvoiceVatNote,
  formatInvoiceMoney,
  getInvoiceCompanyConfig,
  splitFooterLegalSentences,
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

const ROW_H = 36;
const SECTION_GAP = 20;

function formatMoney(amount: number, currency: string): string {
  return formatInvoiceMoney(amount, currency);
}

export function renderPlatformRevenueReport(
  doc: PDFKit.PDFDocument,
  data: PlatformRevenueReportData,
): void {
  const company = getInvoiceCompanyConfig();
  let y = drawCover(doc, data, company);
  y = drawRecordsSection(doc, data, y);
  y = drawSummary(doc, data, company, y);
  y = ensurePageSpace(doc, y, 72);
  drawNote(doc, company, y);
}

export function attachPlatformRevenueFooters(doc: PDFKit.PDFDocument, reportNumber: string): void {
  const company = getInvoiceCompanyConfig();
  const legal = splitFooterLegalSentences(buildDocumentFooterLegal('platform_invoice', company));
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
    .text('Platform revenue register', PDF_MARGIN, y + 8);
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
        `Activity to ${formatReceiptDate(data.issuedAt)} — not a final month-end register.`,
        PDF_MARGIN,
        y,
      );
    y += 18;
  }

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(PDF_RGB.muted)
    .text(`Report ref: ${data.reportNumber}`, PDF_MARGIN, y);
  y += 14;
  doc.text(`Issued: ${formatReceiptDate(data.issuedAt)}`, PDF_MARGIN, y);
  y += 24;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(PDF_RGB.text)
    .text(company.displayName, PDF_MARGIN, y);
  y += 12;
  const addressLines = company.formattedAddress.split(', ').filter(Boolean);
  for (const line of addressLines) {
    doc.font('Helvetica').fontSize(8.5).fillColor(PDF_RGB.muted).text(line, PDF_MARGIN, y);
    y += 11;
  }

  return y + SECTION_GAP;
}

function drawRecordsSection(
  doc: PDFKit.PDFDocument,
  data: PlatformRevenueReportData,
  startY: number,
): number {
  let y = ensurePageSpace(doc, startY, 80);
  y = drawSectionTitle(doc, 'Revenue records', y);

  if (data.records.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(PDF_RGB.muted)
      .text('No records match the current filters.', PDF_MARGIN, y);
    return y + 24;
  }

  const cols = [
    { label: 'Type', width: 68 },
    { label: 'Date', width: 52 },
    { label: 'Reference', width: 78 },
    { label: 'Party', width: 88 },
    { label: 'Description', width: 130 },
    { label: 'Amount', width: 58, align: 'right' as const },
  ];

  y = drawTableHeader(doc, cols, y);
  for (const row of data.records) {
    y = ensurePageSpace(doc, y, ROW_H, () => drawContinuationHeader(doc, 'Revenue records'));
    y = drawRecordRow(doc, cols, row, y);
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
  const lines: { label: string; value: string; emphasis?: boolean }[] = [
    { label: 'Records', value: String(data.records.length) },
    {
      label: 'Platform services',
      value: formatMoney(summary.platformServicesGross, summary.currency),
    },
    {
      label: 'Marketplace fees',
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
    label: 'Total',
    value: formatMoney(summary.totalRevenueGross, summary.currency),
    emphasis: true,
  });

  const panelHeight = 28 + lines.length * 18 + 16;
  let y = ensurePageSpace(doc, startY, panelHeight + 24);
  y = drawSectionTitle(doc, 'Period summary', y);

  const panelX = PDF_MARGIN;
  const panelW = PDF_PAGE.width - PDF_MARGIN * 2;
  doc.roundedRect(panelX, y, panelW, panelHeight, 4).fillColor([248, 250, 252]).fill();
  doc.roundedRect(panelX, y, panelW, panelHeight, 4).strokeColor(PDF_RGB.border).lineWidth(0.5).stroke();

  let innerY = y + 14;
  for (const line of lines) {
    doc
      .font(line.emphasis ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(line.emphasis ? 10 : 9)
      .fillColor(PDF_RGB.text)
      .text(line.label, panelX + 14, innerY, { width: panelW * 0.55 });
    doc.text(line.value, panelX + 14, innerY, {
      width: panelW - 28,
      align: 'right',
    });
    innerY += line.emphasis ? 20 : 18;
  }

  return y + panelHeight + SECTION_GAP;
}

function drawNote(doc: PDFKit.PDFDocument, config: InvoiceCompanyConfig, y: number): void {
  const note = [
    'This register summarises SellNearby platform revenue for the period shown: direct platform service invoices and marketplace commission on listing sales.',
    'Use individual SN-INV invoices and payment records as supporting audit evidence.',
    buildPlatformInvoiceVatNote(config),
  ].join(' ');

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text(note, PDF_MARGIN, y, { width: PDF_PAGE.width - PDF_MARGIN * 2, align: 'justify' });
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_RGB.primaryDark).text(title, PDF_MARGIN, y);
  return y + 22;
}

interface ColDef {
  label: string;
  width: number;
  align?: 'left' | 'right';
}

function drawTableHeader(doc: PDFKit.PDFDocument, cols: ColDef[], y: number): number {
  let x = PDF_MARGIN;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF_RGB.muted);
  for (const col of cols) {
    doc.text(col.label, x, y, { width: col.width, align: col.align ?? 'left', lineBreak: false });
    x += col.width + 4;
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

function drawRecordRow(
  doc: PDFKit.PDFDocument,
  cols: ColDef[],
  row: FinanceRecordLine,
  y: number,
): number {
  let x = PDF_MARGIN;
  const cells = [
    row.typeLabel,
    formatReceiptDate(row.date),
    row.reference,
    row.partyEmail,
    row.description,
    formatMoney(row.amount, row.currency),
  ];
  doc.font('Helvetica').fontSize(8).fillColor(PDF_RGB.text);
  for (let i = 0; i < cols.length; i += 1) {
    const col = cols[i]!;
    const cell = cells[i] ?? '';
    doc.text(cell, x, y, {
      width: col.width,
      align: col.align ?? 'left',
      height: ROW_H - 8,
      ellipsis: true,
    });
    x += col.width + 4;
  }
  return y + ROW_H;
}
