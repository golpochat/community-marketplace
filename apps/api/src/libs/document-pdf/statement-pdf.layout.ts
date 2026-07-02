import type PDFKit from 'pdfkit';

import type { InvoiceCompanyConfig } from '@community-marketplace/config';
import {
  buildDocumentFooterLegal,
  buildStatementNote,
  formatInvoiceMoney,
  getInvoiceCompanyConfig,
  resolveDocumentWebsite,
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
import type {
  AccountStatementData,
  BuyerPurchaseStatementLine,
  PayoutStatementLine,
  PlatformServiceStatementLine,
  SaleStatementLine,
} from '../../modules/statements/lib/account-statement.types';
import {
  formatStatementPeriodRange,
  isSellerStatementSummary as isSellerSummary,
} from '../../modules/statements/lib/account-statement.types';
import { formatReceiptDate } from '../../modules/payments/lib/payment-receipt.types';

const ROW_H = 36;
const ROW_H_DETAIL = 48;
const SECTION_GAP = 20;

function formatMoney(amount: number, currency: string): string {
  return formatInvoiceMoney(amount, currency);
}

function formatSignedOutflow(amount: number, currency: string): string {
  if (amount <= 0) return formatMoney(0, currency);
  return `(${formatMoney(amount, currency)})`;
}

function formatNetActivity(amount: number, currency: string): string {
  if (amount < 0) return formatSignedOutflow(Math.abs(amount), currency);
  return formatMoney(amount, currency);
}

export function renderAccountStatement(doc: PDFKit.PDFDocument, data: AccountStatementData): void {
  const company = getInvoiceCompanyConfig();
  let y = drawStatementCover(doc, data, company);

  if (data.role === 'seller') {
    y = drawSalesSection(doc, data, y);
    y = drawPlatformServicesSection(doc, data, y);
    y = drawPayoutsSection(doc, data, y);
    y = drawSellerSummary(doc, data, company, y);
  } else {
    y = drawBuyerPurchasesSection(doc, data, y);
    y = drawBuyerSummary(doc, data, company, y);
  }

  y = ensurePageSpace(doc, y, 72);
  y = drawStatementNote(doc, data, y);
}

function drawStatementCover(
  doc: PDFKit.PDFDocument,
  data: AccountStatementData,
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
    doc.font('Helvetica-Bold').fontSize(18).fillColor(PDF_RGB.primaryDark).text(company.displayName, PDF_MARGIN, y);
    y += 28;
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(PDF_RGB.text)
    .text(data.role === 'seller' ? 'Seller account statement' : 'Buyer purchase statement', PDF_MARGIN, y + 8);
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
        `Activity to ${formatReceiptDate(data.issuedAt)} — not a final month-end statement.`,
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
    .text('ACCOUNT HOLDER', leftX, y + 12, { characterSpacing: 0.6 });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PDF_RGB.text).text(data.accountHolderName, leftX, y + 24);
  doc.font('Helvetica').fontSize(9).fillColor(PDF_RGB.muted).text(data.accountHolderEmail, leftX, y + 38);

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(PDF_RGB.muted)
    .text('STATEMENT DETAILS', rightX, y + 12, { characterSpacing: 0.6 });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(PDF_RGB.muted)
    .text('Reference', rightX, y + 24);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_RGB.text)
    .text(data.statementNumber, rightX, y + 34);
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_RGB.muted).text('Issued', rightX, y + 50);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(PDF_RGB.text)
    .text(formatReceiptDate(data.issuedAt), rightX, y + 60);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text(`Issued by ${company.displayName}`, leftX, y + 58, { width: colW });
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(PDF_RGB.muted)
    .text(company.formattedAddress, leftX, y + 70, { width: colW });

  return y + 88 + SECTION_GAP;
}

function drawSectionTitle(doc: PDFKit.PDFDocument, y: number, title: string, subtitle: string): number {
  y = ensurePageSpace(doc, y, 48, () => PDF_CONTENT_TOP);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_RGB.primaryDark).text(title, PDF_MARGIN, y);
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_RGB.muted).text(subtitle, PDF_MARGIN, y + 14, {
    width: PDF_PAGE.width - PDF_MARGIN * 2,
  });
  return y + 32;
}

function drawSalesSection(doc: PDFKit.PDFDocument, data: AccountStatementData, y: number): number {
  y = drawSectionTitle(
    doc,
    y,
    'A. Marketplace sales',
    'Payments received from buyers for your listings. Marketplace fee is deducted per sale.',
  );

  if (data.salesLines.length === 0) {
    return drawEmptySection(doc, y, 'No marketplace sales in this period.');
  }

  const cols = [
    { label: 'DATE', width: 0.14, align: 'left' as const },
    { label: 'LISTING', width: 0.34, align: 'left' as const },
    { label: 'GROSS', width: 0.14, align: 'right' as const },
    { label: 'FEE', width: 0.14, align: 'right' as const },
    { label: 'NET', width: 0.14, align: 'right' as const },
  ];

  y = drawTableHeader(doc, y, cols);
  for (const line of data.salesLines) {
    y = ensurePageSpace(doc, y, ROW_H_DETAIL, () => {
      let ny = drawContinuationHeader(doc, 'A. Marketplace sales');
      ny = drawTableHeader(doc, ny, cols);
      return ny;
    });
    y = drawSalesRow(doc, y, line, cols);
  }
  return y + SECTION_GAP;
}

function drawPlatformServicesSection(
  doc: PDFKit.PDFDocument,
  data: AccountStatementData,
  y: number,
): number {
  y = drawSectionTitle(
    doc,
    y,
    'B. Platform services',
    'Charges for SellNearby packages (featured listings, boosts, verification, store slots, etc.).',
  );

  if (data.platformServiceLines.length === 0) {
    return drawEmptySection(doc, y, 'No platform service purchases in this period.');
  }

  const cols = [
    { label: 'DATE', width: 0.14, align: 'left' as const },
    { label: 'SERVICE', width: 0.32, align: 'left' as const },
    { label: 'INVOICE', width: 0.28, align: 'left' as const },
    { label: 'CHARGE', width: 0.14, align: 'right' as const },
  ];

  y = drawTableHeader(doc, y, cols);
  for (const line of data.platformServiceLines) {
    y = ensurePageSpace(doc, y, ROW_H_DETAIL, () => {
      let ny = drawContinuationHeader(doc, 'B. Platform services');
      ny = drawTableHeader(doc, ny, cols);
      return ny;
    });
    y = drawPlatformServiceRow(doc, y, line, cols);
  }
  return y + SECTION_GAP;
}

function drawPayoutsSection(doc: PDFKit.PDFDocument, data: AccountStatementData, y: number): number {
  if (!isSellerSummary(data.summary)) return y;

  y = drawSectionTitle(
    doc,
    y,
    'C. Bank payouts',
    'Funds paid out to your connected Stripe account during this period.',
  );

  if (data.payoutLines.length === 0) {
    return drawEmptySection(doc, y, 'No bank payouts recorded in this period.');
  }

  const cols = [
    { label: 'DATE', width: 0.18, align: 'left' as const },
    { label: 'REFERENCE', width: 0.38, align: 'left' as const },
    { label: 'STATUS', width: 0.18, align: 'left' as const },
    { label: 'AMOUNT', width: 0.16, align: 'right' as const },
  ];

  y = drawTableHeader(doc, y, cols);
  for (const line of data.payoutLines) {
    y = ensurePageSpace(doc, y, ROW_H_DETAIL, () => {
      let ny = drawContinuationHeader(doc, 'C. Bank payouts');
      ny = drawTableHeader(doc, ny, cols);
      return ny;
    });
    y = drawPayoutRow(doc, y, line, cols);
  }
  return y + SECTION_GAP;
}

function drawPayoutRow(
  doc: PDFKit.PDFDocument,
  y: number,
  line: PayoutStatementLine,
  cols: ColDef[],
): number {
  const tableW = PDF_PAGE.width - PDF_MARGIN * 2;
  const rowH = ROW_H_DETAIL;
  strokeRow(doc, y, tableW, rowH);

  const values = [
    formatReceiptDate(line.date),
    line.reference,
    line.status,
    formatMoney(line.amount, line.currency),
  ];

  let x = PDF_MARGIN + 10;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]!;
    const w = tableW * col.width - 8;
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(PDF_RGB.text)
      .text(values[i] ?? '', x, y + 14, { width: w, align: col.align, lineBreak: false });
    x += tableW * col.width;
  }
  return y + rowH;
}

function drawBuyerPurchasesSection(doc: PDFKit.PDFDocument, data: AccountStatementData, y: number): number {
  y = drawSectionTitle(
    doc,
    y,
    'Marketplace purchases',
    'Payments you made to sellers through SellNearby in this period.',
  );

  if (data.buyerPurchaseLines.length === 0) {
    return drawEmptySection(doc, y, 'No purchases in this period.');
  }

  const cols = [
    { label: 'DATE', width: 0.16, align: 'left' as const },
    { label: 'LISTING', width: 0.44, align: 'left' as const },
    { label: 'RECEIPT', width: 0.2, align: 'left' as const },
    { label: 'AMOUNT', width: 0.14, align: 'right' as const },
  ];

  y = drawTableHeader(doc, y, cols);
  for (const line of data.buyerPurchaseLines) {
    y = ensurePageSpace(doc, y, ROW_H_DETAIL, () => {
      let ny = drawContinuationHeader(doc, 'Marketplace purchases');
      ny = drawTableHeader(doc, ny, cols);
      return ny;
    });
    y = drawBuyerRow(doc, y, line, cols);
  }
  return y + SECTION_GAP;
}

interface ColDef {
  label: string;
  width: number;
  align: 'left' | 'right';
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number, cols: ColDef[]): number {
  const tableW = PDF_PAGE.width - PDF_MARGIN * 2;
  const headerH = 26;
  doc.roundedRect(PDF_MARGIN, y, tableW, headerH, 3).fillColor([241, 245, 244]).fill();
  let x = PDF_MARGIN + 10;
  for (const col of cols) {
    const w = tableW * col.width - 8;
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor(PDF_RGB.muted)
      .text(col.label, x, y + 9, { width: w, align: col.align, characterSpacing: 0.5 });
    x += tableW * col.width;
  }
  return y + headerH;
}

function drawSalesRow(
  doc: PDFKit.PDFDocument,
  y: number,
  line: SaleStatementLine,
  cols: ColDef[],
): number {
  const tableW = PDF_PAGE.width - PDF_MARGIN * 2;
  const rowH = ROW_H_DETAIL;
  strokeRow(doc, y, tableW, rowH);

  const values = [
    formatReceiptDate(line.date),
    line.listingTitle,
    formatMoney(line.gross, line.currency),
    formatSignedOutflow(line.marketplaceFee, line.currency),
    formatMoney(line.netToSeller, line.currency),
  ];

  let x = PDF_MARGIN + 10;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]!;
    const w = tableW * col.width - 8;
    const isTitle = i === 1;
    doc
      .font(isTitle ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isTitle ? 9 : 8.5)
      .fillColor(PDF_RGB.text)
      .text(values[i] ?? '', x, y + 10, { width: w, align: col.align, lineBreak: false });
    if (isTitle) {
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(PDF_RGB.muted)
        .text(line.receiptRef, x, y + 24, { width: w });
    }
    x += tableW * col.width;
  }
  return y + rowH;
}

function drawPlatformServiceRow(
  doc: PDFKit.PDFDocument,
  y: number,
  line: PlatformServiceStatementLine,
  cols: ColDef[],
): number {
  const tableW = PDF_PAGE.width - PDF_MARGIN * 2;
  const rowH = ROW_H_DETAIL;
  strokeRow(doc, y, tableW, rowH);

  const values = [
    formatReceiptDate(line.date),
    line.serviceLabel,
    line.invoiceNumber,
    formatMoney(line.amount, line.currency),
  ];

  let x = PDF_MARGIN + 10;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]!;
    const w = tableW * col.width - 8;
    doc
      .font(i === 1 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8.5)
      .fillColor(PDF_RGB.text)
      .text(values[i] ?? '', x, y + 14, { width: w, align: col.align, lineBreak: false });
    x += tableW * col.width;
  }
  return y + rowH;
}

function drawBuyerRow(
  doc: PDFKit.PDFDocument,
  y: number,
  line: BuyerPurchaseStatementLine,
  cols: ColDef[],
): number {
  const tableW = PDF_PAGE.width - PDF_MARGIN * 2;
  const rowH = ROW_H_DETAIL;
  strokeRow(doc, y, tableW, rowH);

  const values = [
    formatReceiptDate(line.date),
    line.listingTitle,
    line.receiptRef,
    formatMoney(line.amount, line.currency),
  ];

  let x = PDF_MARGIN + 10;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]!;
    const w = tableW * col.width - 8;
    doc
      .font(i === 1 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8.5)
      .fillColor(PDF_RGB.text)
      .text(values[i] ?? '', x, y + 14, { width: w, align: col.align, lineBreak: false });
    x += tableW * col.width;
  }
  return y + rowH;
}

function strokeRow(doc: PDFKit.PDFDocument, y: number, tableW: number, rowH: number): void {
  doc
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.5)
    .moveTo(PDF_MARGIN, y + rowH)
    .lineTo(PDF_MARGIN + tableW, y + rowH)
    .stroke();
}

function drawEmptySection(doc: PDFKit.PDFDocument, y: number, message: string): number {
  const boxW = PDF_PAGE.width - PDF_MARGIN * 2;
  doc.roundedRect(PDF_MARGIN, y, boxW, 40, 4).fillColor(PDF_RGB.white).fill();
  doc
    .font('Helvetica-Oblique')
    .fontSize(9)
    .fillColor(PDF_RGB.muted)
    .text(message, PDF_MARGIN + 14, y + 14);
  return y + 40 + SECTION_GAP;
}

function drawSellerSummary(
  doc: PDFKit.PDFDocument,
  data: AccountStatementData,
  _config: InvoiceCompanyConfig,
  y: number,
): number {
  if (!isSellerSummary(data.summary)) return y;
  const s = data.summary;

  const panelW = PDF_PAGE.width - PDF_MARGIN * 2;
  const padX = 16;
  const contentW = panelW - padX * 2;

  const lines: Array<{ label: string; value: string; emphasis?: boolean }> = [
    { label: 'Gross sales (Section A)', value: formatMoney(s.grossSales, s.currency) },
    {
      label: 'Marketplace fees on sales',
      value: formatSignedOutflow(s.marketplaceFeesOnSales, s.currency),
    },
    { label: 'Net from sales', value: formatMoney(s.netFromSales, s.currency) },
    {
      label: 'Platform services (Section B)',
      value: formatSignedOutflow(s.platformServices, s.currency),
    },
    {
      label: 'Net period activity',
      value: formatNetActivity(s.netPeriodActivity, s.currency),
      emphasis: true,
    },
  ];

  if (s.payoutsReceivedInPeriod > 0) {
    lines.push({
      label: 'Bank payouts (Section C)',
      value: formatMoney(s.payoutsReceivedInPeriod, s.currency),
    });
  }
  if (s.pendingSettlementNet > 0) {
    lines.push({
      label: 'Pending settlement (Section A)',
      value: formatMoney(s.pendingSettlementNet, s.currency),
    });
  }

  const footnote =
    `${s.saleCount} sale(s), ${s.platformServiceCount} platform service(s)` +
    (s.payoutCount > 0 ? `, ${s.payoutCount} payout(s)` : '') +
    '. Parentheses denote charges. Invoice numbers in Section B match downloadable PDF invoices.';

  doc.font('Helvetica').fontSize(7.5);
  const footnoteHeight = doc.heightOfString(footnote, { width: contentW, lineGap: 1.5 });

  const rowHeight = (emphasis?: boolean) => (emphasis ? 28 : 22);
  const rowsHeight = lines.reduce((sum, line) => sum + rowHeight(line.emphasis), 0);
  const panelH = 14 + rowsHeight + 12 + 1 + 10 + footnoteHeight + 14;

  y = ensurePageSpace(doc, y, panelH + 34);

  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_RGB.primaryDark).text('Period summary', PDF_MARGIN, y);
  const panelTop = y + 22;

  doc.roundedRect(PDF_MARGIN, panelTop, panelW, panelH, 6).fillColor(PDF_RGB.white).fill();
  doc.strokeColor(PDF_RGB.border).lineWidth(0.75).roundedRect(PDF_MARGIN, panelTop, panelW, panelH, 6).stroke();

  let lineY = panelTop + 14;
  for (const line of lines) {
    const h = rowHeight(line.emphasis);
    doc
      .font(line.emphasis ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(line.emphasis ? 10 : 9)
      .fillColor(line.emphasis ? PDF_RGB.primaryDark : PDF_RGB.muted)
      .text(line.label, PDF_MARGIN + padX, lineY, { width: contentW * 0.62, lineBreak: false });
    doc
      .font(line.emphasis ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(line.emphasis ? 12 : 9)
      .fillColor(line.emphasis ? PDF_RGB.primaryDark : PDF_RGB.text)
      .text(line.value, PDF_MARGIN + padX, lineY, {
        width: contentW,
        align: 'right',
        lineBreak: false,
      });
    lineY += h;
  }

  const dividerY = lineY + 6;
  doc
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.5)
    .moveTo(PDF_MARGIN + padX, dividerY)
    .lineTo(PDF_MARGIN + panelW - padX, dividerY)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(PDF_RGB.muted)
    .text(footnote, PDF_MARGIN + padX, dividerY + 10, { width: contentW, lineGap: 1.5 });

  return panelTop + panelH + SECTION_GAP;
}

function drawBuyerSummary(
  doc: PDFKit.PDFDocument,
  data: AccountStatementData,
  _config: InvoiceCompanyConfig,
  y: number,
): number {
  const s = data.summary;
  if (isSellerSummary(s)) return y;

  y = ensurePageSpace(doc, y, 80);
  const panelW = 280;
  const panelX = PDF_PAGE.width - PDF_MARGIN - panelW;
  doc.roundedRect(panelX, y, panelW, 64, 6).fillColor(PDF_RGB.white).fill();
  doc.strokeColor(PDF_RGB.border).lineWidth(0.75).roundedRect(panelX, y, panelW, 64, 6).stroke();
  doc.font('Helvetica').fontSize(9).fillColor(PDF_RGB.muted).text('Total purchases', panelX + 14, y + 14);
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(PDF_RGB.primaryDark)
    .text(formatMoney(s.totalPurchases, s.currency), panelX + 14, y + 28);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text(`${s.purchaseCount} transaction(s)`, panelX + 14, y + 48);
  return y + 64 + SECTION_GAP;
}

function drawStatementNote(doc: PDFKit.PDFDocument, data: AccountStatementData, y: number): number {
  const boxW = PDF_PAGE.width - PDF_MARGIN * 2;
  const text = buildStatementNote(data.role);
  const pad = 12;
  doc.font('Helvetica').fontSize(8);
  const textHeight = doc.heightOfString(text, { width: boxW - pad * 2, lineGap: 2 });
  const height = textHeight + pad * 2;
  y = ensurePageSpace(doc, y, height + 8);
  doc.roundedRect(PDF_MARGIN, y, boxW, height, 4).fillColor([245, 245, 244]).fill();
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(PDF_RGB.muted)
    .text(text, PDF_MARGIN + pad, y + pad, { width: boxW - pad * 2, lineGap: 2 });
  return y + height + SECTION_GAP;
}

function drawStatementFooter(
  doc: PDFKit.PDFDocument,
  config: InvoiceCompanyConfig,
  statementNumber: string,
): void {
  const company = getPdfCompany(config);
  const footerY = PDF_PAGE.height - PDF_FOOTER_RESERVE + 8;
  const contentW = PDF_PAGE.width - PDF_MARGIN * 2;

  doc
    .strokeColor(PDF_RGB.border)
    .lineWidth(0.5)
    .moveTo(PDF_MARGIN, footerY)
    .lineTo(PDF_PAGE.width - PDF_MARGIN, footerY)
    .stroke();

  const footerLogo = resolveInvoiceBrandAssetPath(company.logoFooterFile, company);
  if (footerLogo) {
    doc.image(footerLogo, PDF_MARGIN, footerY + 10, { width: 80 });
  }

  const website = resolveDocumentWebsite(config);

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(PDF_RGB.muted)
    .text(company.supportEmail, PDF_MARGIN, footerY + 34);
  doc.font('Helvetica').fontSize(7.5).fillColor(PDF_RGB.muted).text(website, PDF_MARGIN, footerY + 46);

  const legalParts = splitFooterLegalSentences(buildDocumentFooterLegal('statement', company));
  let legalY = footerY + 8;
  for (const sentence of legalParts) {
    doc.font('Helvetica').fontSize(6.5).fillColor(PDF_RGB.footer);
    const blockH = doc.heightOfString(sentence, { width: contentW - 100, lineGap: 1.2 });
    doc.text(sentence, PDF_MARGIN + 100, legalY, { width: contentW - 100, lineGap: 1.2 });
    legalY += blockH + 4;
  }

  doc
    .font('Helvetica')
    .fontSize(6)
    .fillColor(PDF_RGB.footer)
    .text(statementNumber, PDF_MARGIN, PDF_PAGE.height - 18, { width: contentW, align: 'right' });
}

// Register footer on every page when rendering multi-page statements
export function attachStatementPageFooters(
  doc: PDFKit.PDFDocument,
  statementNumber: string,
  config?: InvoiceCompanyConfig,
): void {
  const company = config ?? getInvoiceCompanyConfig();
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawStatementFooter(doc, company, `${statementNumber} · Page ${i + 1} of ${range.count}`);
  }
}
