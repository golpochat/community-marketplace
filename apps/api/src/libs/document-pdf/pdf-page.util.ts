import type PDFKit from 'pdfkit';

import { PDF_MARGIN, PDF_PAGE } from './document-pdf.theme';

export const PDF_FOOTER_RESERVE = 100;
export const PDF_CONTENT_TOP = 56;

export function contentBottomY(): number {
  return PDF_PAGE.height - PDF_FOOTER_RESERVE;
}

export function ensurePageSpace(
  doc: PDFKit.PDFDocument,
  y: number,
  requiredHeight: number,
  onNewPage?: () => number,
): number {
  if (y + requiredHeight <= contentBottomY()) return y;
  doc.addPage();
  return onNewPage?.() ?? PDF_CONTENT_TOP;
}

export function drawPageBackground(doc: PDFKit.PDFDocument): void {
  doc.save();
  doc.rect(0, 0, PDF_PAGE.width, PDF_PAGE.height).fillColor([252, 252, 251]).fill();
  doc.restore();
}

export function drawContinuationHeader(doc: PDFKit.PDFDocument, title: string, y = PDF_MARGIN): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor([120, 113, 108])
    .text(`${title} (continued)`, PDF_MARGIN, y, { lineBreak: false });
  return y + 20;
}
