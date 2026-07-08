import {
  APP_SHORT_NAME,
  BRAND_COLORS,
  buildBrandedEmailHtml,
  buildEmailCtaButton,
  emailFooterCopyrightStyle,
  escapeHtml,
} from '@community-marketplace/config';

import type { PaymentReceiptEmailContent } from '../../payments/templates/payment-receipt-email.template';
import type { PlatformPurchaseInvoiceData } from '../lib/platform-purchase-invoice.types';
import { formatReceiptDate, formatReceiptMoney } from '../lib/platform-purchase-invoice.types';

const c = BRAND_COLORS;

export function buildPlatformPurchaseInvoiceEmail(
  data: PlatformPurchaseInvoiceData,
  downloadPath: string,
): PaymentReceiptEmailContent {
  const webAppUrl = data.webAppUrl.replace(/\/$/, '');
  const downloadUrl = `${webAppUrl}${downloadPath}`;
  const amount = formatReceiptMoney(data.amount, data.currency);
  const subject = `Invoice ${data.invoiceNumber} — ${data.purchaseLabel}`;
  const preheader = `Your payment of ${amount} for ${data.purchaseLabel} is confirmed. Invoice attached.`;

  const text = [
    `Hi ${data.customerName},`,
    '',
    `Thanks for your payment on ${APP_SHORT_NAME}.`,
    `Service: ${data.purchaseLabel}`,
    `Amount: ${amount}`,
    `Invoice number: ${data.invoiceNumber}`,
    `Date: ${formatReceiptDate(data.issuedAt)}`,
    '',
    `Download invoice: ${downloadUrl}`,
    '',
    'Your PDF invoice is attached to this email for your records.',
    '',
    APP_SHORT_NAME,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${c.textPrimary};">Hi ${escapeHtml(data.customerName)},</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${c.textPrimary};">Payment confirmed</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      Thanks for your payment for <strong style="color:${c.textPrimary};">${escapeHtml(data.purchaseLabel)}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr><td style="padding:8px 0;font-size:14px;color:${c.textMuted};">Invoice number</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:${c.textPrimary};">${escapeHtml(data.invoiceNumber)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:${c.textMuted};">Amount</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:${c.textPrimary};">${escapeHtml(amount)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:${c.textMuted};">Date</td><td style="padding:8px 0;font-size:14px;color:${c.textPrimary};">${escapeHtml(formatReceiptDate(data.issuedAt))}</td></tr>
    </table>
    ${buildEmailCtaButton('Download invoice', downloadUrl)}
    <p style="margin:0;font-size:13px;line-height:1.5;color:${c.textMuted};">Your PDF invoice is attached to this email for your records.</p>`;

  const footerHtml = `<p style="${emailFooterCopyrightStyle()}">&copy; ${new Date().getFullYear()} ${escapeHtml(APP_SHORT_NAME)}</p>`;

  const html = buildBrandedEmailHtml({
    subject,
    preheader,
    headerTitle: APP_SHORT_NAME,
    headerSubtitle: 'Platform service invoice',
    bodyHtml,
    footerHtml,
  });

  return {
    subject,
    preheader,
    html,
    text,
    attachmentFilename: `invoice-${data.invoiceNumber}.pdf`,
  };
}
