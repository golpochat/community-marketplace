import {
  APP_SHORT_NAME,
  BRAND_COLORS,
  buildBrandedEmailHtml,
  buildEmailCtaButton,
  escapeHtml,
} from '@community-marketplace/config';

const c = BRAND_COLORS;

export const ADMIN_INVITATION_EXPIRY_DAYS = 7;

export interface AdminInvitationEmailTemplateInput {
  email: string;
  displayName: string;
  roleName: string;
  setupUrl: string;
  supportEmail?: string;
  webAppUrl?: string;
}

export interface AdminInvitationEmailContent {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

function greeting(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed ? `Hello ${trimmed},` : 'Hello,';
}

export function buildAdminInvitationEmailContent(
  input: AdminInvitationEmailTemplateInput,
): AdminInvitationEmailContent {
  const appName = APP_SHORT_NAME;
  const supportEmail = input.supportEmail?.trim() || 'support@sellnearby.ie';
  const webAppUrl = (input.webAppUrl ?? 'https://sellnearby.ie').replace(/\/$/, '');
  const safeUrl = escapeHtml(input.setupUrl);
  const safeEmail = escapeHtml(input.email);
  const safeRole = escapeHtml(input.roleName);
  const safeGreeting = escapeHtml(greeting(input.displayName));
  const year = new Date().getFullYear();

  const subject = `${appName} – You are invited to join as ${input.roleName}`;
  const preheader = `Complete your ${appName} administrator setup. This invitation expires in ${ADMIN_INVITATION_EXPIRY_DAYS} days.`;

  const stepRow = (number: number, title: string, detail: string) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid ${c.borderSubtle};">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${c.textPrimary};">${number}. ${escapeHtml(title)}</p>
        <p style="margin:0;font-size:14px;line-height:1.5;color:${c.textMuted};">${escapeHtml(detail)}</p>
      </td>
    </tr>`;

  const text = [
    greeting(input.displayName),
    '',
    `You have been invited to join ${appName} as an administrator (${input.roleName}).`,
    '',
    '1. Verify your email — confirm this is your correct email address.',
    '2. Activate your account — activate your administrator account.',
    '3. Set your password — create a secure password to access the platform.',
    '',
    'Complete setup:',
    input.setupUrl,
    '',
    `This link expires in ${ADMIN_INVITATION_EXPIRY_DAYS} days.`,
    '',
    `Invited email: ${input.email}`,
    '',
    'If you did not expect this email, you can safely ignore it.',
    '',
    supportEmail,
    appName,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${c.textPrimary};">${safeGreeting}</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${c.textMuted};">
      You have been invited to join <strong style="color:${c.textPrimary};">${escapeHtml(appName)}</strong>
      as <strong style="color:${c.textPrimary};">${safeRole}</strong>.
      Use the link below to complete your setup:
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
      ${stepRow(1, 'Verify your email', 'Confirm this is your correct email address.')}
      ${stepRow(2, 'Activate your account', 'Activate your administrator account.')}
      ${stepRow(3, 'Set your password', 'Create a secure password to access the platform.')}
    </table>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${c.textMuted};">
      Click the button below to complete all steps. This link expires in
      <strong style="color:${c.textPrimary};">${ADMIN_INVITATION_EXPIRY_DAYS} days</strong>.
    </p>
    ${buildEmailCtaButton('Complete setup', input.setupUrl)}
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${c.textMuted};">
      Invited email: <strong style="color:${c.textPrimary};">${safeEmail}</strong>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" target="_blank" style="color:${c.primary};text-decoration:underline;">${safeUrl}</a>
    </p>`;

  const footerHtml = `
    <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${c.textMuted};">
      If you did not expect this email, you can safely ignore it.
    </p>
    <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${c.textFooter};">
      ${escapeHtml(appName)} · Admin invitation
    </p>
    <p style="margin:0;font-size:12px;line-height:1.5;color:${c.textFooter};">
      &copy; ${year} ${escapeHtml(appName)}. All rights reserved.
    </p>`;

  const html = buildBrandedEmailHtml({
    subject,
    preheader,
    headerTitle: appName,
    headerSubtitle: 'Admin invitation',
    bodyHtml,
    footerHtml,
  });

  return { subject, preheader, html, text };
}

export function buildAdminInvitationUrl(appBaseUrl: string, token: string): string {
  const base = appBaseUrl.replace(/\/$/, '');
  return `${base}/admin/invite/accept?token=${encodeURIComponent(token)}`;
}
