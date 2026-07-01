import { APP_SHORT_NAME, BRAND_COLORS, buildBrandedEmailHtml, buildEmailCtaButton, escapeHtml } from '@community-marketplace/config';

import type { PaymentReceiptDocumentData } from '../lib/payment-receipt.types';
import { formatReceiptDate, formatReceiptMoney } from '../lib/payment-receipt.types';

const c = BRAND_COLORS;

export interface PaymentReceiptEmailContent {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  attachmentFilename: string;
}

export function buildBuyerPaymentReceiptEmail(
  data: PaymentReceiptDocumentData,
  downloadPath: string,
): PaymentReceiptEmailContent {
  const webAppUrl = data.webAppUrl.replace(/\/$/, '');
  const downloadUrl = `${webAppUrl}${downloadPath}`;
  const amount = formatReceiptMoney(data.grossAmount, data.currency);

  const subject = `Payment receipt ${data.receiptNumber} — ${data.listingTitle}`;
  const preheader = `Your payment of ${amount} for ${data.listingTitle} is confirmed. Receipt attached.`;

  const text = [
    `Hi ${data.buyerName},`,
    '',
    `Your payment of ${amount} for "${data.listingTitle}" is confirmed.`,
    `Receipt number: ${data.receiptNumber}`,
    `Date: ${formatReceiptDate(data.issuedAt)}`,
    '',
    `Download receipt: ${downloadUrl}`,
    '',
    'Your receipt is also attached to this email.',
    '',
    APP_SHORT_NAME,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${c.textPrimary};">Hi ${escapeHtml(data.buyerName)},</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${c.textPrimary};">Payment confirmed</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      Thank you for your purchase on ${escapeHtml(APP_SHORT_NAME)}. Your payment of
      <strong style="color:${c.textPrimary};">${escapeHtml(amount)}</strong> for
      <strong style="color:${c.textPrimary};">${escapeHtml(data.listingTitle)}</strong> was successful.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
      <tr><td style="padding:8px 0;font-size:14px;color:${c.textMuted};">Receipt number</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:${c.textPrimary};">${escapeHtml(data.receiptNumber)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:${c.textMuted};">Seller</td><td style="padding:8px 0;font-size:14px;color:${c.textPrimary};">${escapeHtml(data.sellerName)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:${c.textMuted};">Date</td><td style="padding:8px 0;font-size:14px;color:${c.textPrimary};">${escapeHtml(formatReceiptDate(data.issuedAt))}</td></tr>
    </table>
    ${buildEmailCtaButton('Download receipt', downloadUrl)}
    <p style="margin:0;font-size:13px;line-height:1.5;color:${c.textMuted};">Your PDF receipt is attached to this email for your records.</p>`;

  const footerHtml = `<p style="margin:0;font-size:12px;color:${c.textFooter};">&copy; ${new Date().getFullYear()} ${escapeHtml(APP_SHORT_NAME)}</p>`;

  const html = buildBrandedEmailHtml({
    subject,
    preheader,
    headerTitle: APP_SHORT_NAME,
    headerSubtitle: 'Payment confirmation',
    bodyHtml,
    footerHtml,
  });

  return {
    subject,
    preheader,
    html,
    text,
    attachmentFilename: `receipt-${data.receiptNumber}.pdf`,
  };
}

export function buildSellerPaymentRecordEmail(
  data: PaymentReceiptDocumentData,
  downloadPath: string,
): PaymentReceiptEmailContent {
  const webAppUrl = data.webAppUrl.replace(/\/$/, '');
  const downloadUrl = `${webAppUrl}${downloadPath}`;
  const net = formatReceiptMoney(data.netAmount, data.currency);

  const subject = `Sale recorded ${data.receiptNumber} — ${data.listingTitle}`;
  const preheader = `You received a payment for ${data.listingTitle}. Net: ${net}. Record attached.`;

  const text = [
    `Hi ${data.sellerName},`,
    '',
    `You received a payment for "${data.listingTitle}".`,
    `Record number: ${data.receiptNumber}`,
    `Net amount: ${net}`,
    '',
    `Download sales record: ${downloadUrl}`,
    '',
    'Your sales record is attached to this email.',
    '',
    APP_SHORT_NAME,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${c.textPrimary};">Hi ${escapeHtml(data.sellerName)},</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${c.textPrimary};">Payment received</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      A buyer paid for your listing <strong style="color:${c.textPrimary};">${escapeHtml(data.listingTitle)}</strong>.
      Your net amount is <strong style="color:${c.textPrimary};">${escapeHtml(net)}</strong>.
    </p>
    ${buildEmailCtaButton('Download sales record', downloadUrl)}
    <p style="margin:0;font-size:13px;line-height:1.5;color:${c.textMuted};">Your PDF sales record is attached to this email.</p>`;

  const footerHtml = `<p style="margin:0;font-size:12px;color:${c.textFooter};">&copy; ${new Date().getFullYear()} ${escapeHtml(APP_SHORT_NAME)}</p>`;

  const html = buildBrandedEmailHtml({
    subject,
    preheader,
    headerTitle: APP_SHORT_NAME,
    headerSubtitle: 'Sale payment record',
    bodyHtml,
    footerHtml,
  });

  return {
    subject,
    preheader,
    html,
    text,
    attachmentFilename: `sales-record-${data.receiptNumber}.pdf`,
  };
}
