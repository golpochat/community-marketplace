import { APP_SHORT_NAME, BRAND_COLORS, buildBrandedEmailHtml, buildEmailCtaButton, escapeHtml } from '@community-marketplace/config';

const ACTIVATION_EXPIRY_HOURS = 24;
const c = BRAND_COLORS;

export interface ActivationEmailTemplateInput {
  email: string;
  activationUrl: string;
  name?: string;
  supportEmail?: string;
  webAppUrl?: string;
}

export interface ActivationEmailContent {
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

export function buildActivationEmailContent(
  input: ActivationEmailTemplateInput,
): ActivationEmailContent {
  const appName = APP_SHORT_NAME;
  const supportEmail = input.supportEmail?.trim() || 'support@sellnearby.ie';
  const webAppUrl = (input.webAppUrl ?? 'https://sellnearby.ie').replace(/\/$/, '');
  const safeUrl = escapeHtml(input.activationUrl);
  const safeEmail = escapeHtml(input.email);
  const safeGreeting = escapeHtml(greeting(input.name));
  const year = new Date().getFullYear();

  const subject = `Activate your ${appName} account`;
  const preheader = `Confirm your email to finish setting up your ${appName} account. Link expires in ${ACTIVATION_EXPIRY_HOURS} hours.`;

  const text = [
    greeting(input.name),
    '',
    `Thanks for signing up for ${appName} — your local community marketplace.`,
    '',
    'Click the link below to confirm your email and activate your account.',
    '',
    input.activationUrl,
    '',
    `This link expires in ${ACTIVATION_EXPIRY_HOURS} hours.`,
    '',
    `Registered email: ${input.email}`,
    '',
    'If you did not create an account, you can safely ignore this email.',
    '',
    `Need help? Contact us at ${supportEmail}`,
    '',
    appName,
    webAppUrl,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${c.textPrimary};">${safeGreeting}</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.3;color:${c.textPrimary};">Activate your account</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      Thanks for signing up for ${escapeHtml(appName)}. You're one step away from getting started.
    </p>
    <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      Click the button below to confirm your email address
      <strong style="color:${c.textPrimary};">${safeEmail}</strong>
      and activate your account.
    </p>
    ${buildEmailCtaButton('Activate my account', input.activationUrl)}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="padding:16px;background-color:${c.surfaceFooter};border-radius:8px;border:1px solid ${c.borderSubtle};">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${c.textPrimary};">Security notice</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:${c.textMuted};">
            This activation link expires in <strong style="color:${c.textPrimary};">${ACTIVATION_EXPIRY_HOURS} hours</strong>.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${c.textMuted};">If the button doesn't work, copy this link:</p>
    <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" target="_blank" style="color:${c.primary};text-decoration:underline;">${safeUrl}</a>
    </p>`;

  const footerHtml = `
    <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${c.textMuted};">
      If you didn't create a ${escapeHtml(appName)} account, you can safely ignore this email.
    </p>
    <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${c.textMuted};">
      Questions? <a href="mailto:${escapeHtml(supportEmail)}" style="color:${c.primary};text-decoration:none;font-weight:500;">${escapeHtml(supportEmail)}</a>
    </p>
    <p style="margin:0;font-size:12px;line-height:1.5;color:${c.textFooter};">&copy; ${year} ${escapeHtml(appName)}. All rights reserved.</p>`;

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
