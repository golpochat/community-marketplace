import { APP_SHORT_NAME, BRAND_COLORS, buildBrandedEmailHtml, buildEmailCtaButton, buildEmailInfoCallout, emailFooterCopyrightStyle, emailFooterLinkStyle, emailFooterTextStyle, escapeHtml } from '@community-marketplace/config';

const RESET_EXPIRY_HOURS = 1;
const c = BRAND_COLORS;

export interface PasswordResetEmailTemplateInput {
  email: string;
  resetUrl: string;
  name?: string;
  supportEmail?: string;
  webAppUrl?: string;
}

export interface PasswordResetEmailContent {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

function greeting(name?: string): string {
  if (name?.trim()) {
    return `Hi ${name.trim()},`;
  }
  return 'Hi there,';
}

export function buildPasswordResetEmailContent(
  input: PasswordResetEmailTemplateInput,
): PasswordResetEmailContent {
  const appName = APP_SHORT_NAME;
  const supportEmail = input.supportEmail?.trim() || 'support@sellnearby.ie';
  const webAppUrl = (input.webAppUrl ?? 'https://sellnearby.ie').replace(/\/$/, '');
  const safeUrl = escapeHtml(input.resetUrl);
  const safeEmail = escapeHtml(input.email);
  const safeGreeting = escapeHtml(greeting(input.name));
  const year = new Date().getFullYear();

  const subject = `Reset your ${appName} password`;
  const preheader = `Use this link to choose a new password. It expires in ${RESET_EXPIRY_HOURS} hour.`;

  const text = [
    greeting(input.name),
    '',
    `We received a request to reset the password for your ${appName} account.`,
    '',
    'Click the link below to choose a new password:',
    '',
    input.resetUrl,
    '',
    `This link expires in ${RESET_EXPIRY_HOURS} hour.`,
    '',
    `Account email: ${input.email}`,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
    '',
    `Need help? Contact us at ${supportEmail}`,
    '',
    appName,
    webAppUrl,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${c.textPrimary};">${safeGreeting}</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.3;color:${c.textPrimary};">Reset your password</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      We received a request to reset the password for your ${escapeHtml(appName)} account
      <strong style="color:${c.textPrimary};">${safeEmail}</strong>.
    </p>
    <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      Click the button below to choose a new password.
    </p>
    ${buildEmailCtaButton('Reset my password', input.resetUrl)}
    ${buildEmailInfoCallout(
      'Security notice',
      `This reset link expires in <strong style="color:${c.textPrimary};">${RESET_EXPIRY_HOURS} hour</strong>. If you did not request this, ignore this email and your password will stay the same.`,
    )}
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${c.textMuted};">If the button doesn't work, copy this link:</p>
    <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" target="_blank" style="color:${c.primary};text-decoration:underline;">${safeUrl}</a>
    </p>`;

  const footerHtml = `
    <p style="${emailFooterTextStyle()}">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="${emailFooterTextStyle()}">
      Questions? <a href="mailto:${escapeHtml(supportEmail)}" style="${emailFooterLinkStyle()}">${escapeHtml(supportEmail)}</a>
    </p>
    <p style="${emailFooterCopyrightStyle()}">&copy; ${year} ${escapeHtml(appName)}. All rights reserved.</p>`;

  const html = buildBrandedEmailHtml({
    subject,
    preheader,
    headerTitle: appName,
    headerSubtitle: 'Your local community marketplace',
    bodyHtml,
    footerHtml,
  });

  return { subject, preheader, html, text };
}
