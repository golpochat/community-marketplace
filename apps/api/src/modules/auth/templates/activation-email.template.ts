import { APP_SHORT_NAME } from '@community-marketplace/config';

/** SellNearby brand — matches web `--brand-primary` (225 100% 61%) */
const BRAND_PRIMARY = '#3366FF';
const BRAND_PRIMARY_DARK = '#2952CC';
const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6B7280';
const TEXT_FOOTER = '#9CA3AF';
const SURFACE_PAGE = '#F3F4F6';
const SURFACE_CARD = '#FFFFFF';
const SURFACE_FOOTER = '#F9FAFB';
const BORDER_SUBTLE = '#E5E7EB';

const ACTIVATION_EXPIRY_HOURS = 24;

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body-cell { padding: 28px 24px !important; }
      .email-header-cell { padding: 28px 24px !important; }
      .email-footer-cell { padding: 20px 24px !important; }
      .cta-button { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${SURFACE_PAGE};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${SURFACE_PAGE};">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${SURFACE_PAGE};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="width:600px;max-width:600px;background-color:${SURFACE_CARD};border-radius:12px;overflow:hidden;border:1px solid ${BORDER_SUBTLE};">
          <tr>
            <td class="email-header-cell" align="center" style="padding:32px 40px;background-color:${BRAND_PRIMARY};background:linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_PRIMARY_DARK} 100%);">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:26px;font-weight:700;line-height:1.2;color:#FFFFFF;letter-spacing:-0.02em;">
                ${escapeHtml(appName)}
              </p>
              <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.4;color:rgba(255,255,255,0.92);">
                Your local community marketplace
              </p>
            </td>
          </tr>
          <tr>
            <td class="email-body-cell" style="padding:40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${TEXT_PRIMARY};">
                ${safeGreeting}
              </p>
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.3;color:${TEXT_PRIMARY};letter-spacing:-0.02em;">
                Activate your account
              </h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${TEXT_MUTED};">
                Thanks for signing up for ${escapeHtml(appName)}. You're one step away from getting started.
              </p>
              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${TEXT_MUTED};">
                Click the button below to confirm your email address
                <strong style="color:${TEXT_PRIMARY};">${safeEmail}</strong>
                and activate your account. We'll sign you in automatically once your email is verified.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:${BRAND_PRIMARY};">
                    <a href="${safeUrl}" target="_blank" class="cta-button" style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:1.2;color:#FFFFFF;text-decoration:none;border-radius:8px;background-color:${BRAND_PRIMARY};">
                      Activate my account
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:16px;background-color:${SURFACE_FOOTER};border-radius:8px;border:1px solid ${BORDER_SUBTLE};">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;line-height:1.4;color:${TEXT_PRIMARY};">
                      Security notice
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:${TEXT_MUTED};">
                      This activation link expires in <strong style="color:${TEXT_PRIMARY};">${ACTIVATION_EXPIRY_HOURS} hours</strong>.
                      For your protection, please do not share this email or link with anyone.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${TEXT_MUTED};">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all;">
                <a href="${safeUrl}" target="_blank" style="color:${BRAND_PRIMARY};text-decoration:underline;">${safeUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td class="email-footer-cell" style="padding:24px 40px;background-color:${SURFACE_FOOTER};border-top:1px solid ${BORDER_SUBTLE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${TEXT_MUTED};">
                If you didn't create a ${escapeHtml(appName)} account, you can safely ignore this email — no action is required.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${TEXT_MUTED};">
                Questions? We're here to help at
                <a href="mailto:${escapeHtml(supportEmail)}" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:500;">${escapeHtml(supportEmail)}</a>
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${TEXT_MUTED};">
                <a href="${escapeHtml(webAppUrl)}" target="_blank" style="color:${BRAND_PRIMARY};text-decoration:none;">${escapeHtml(webAppUrl.replace(/^https?:\/\//, ''))}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${TEXT_FOOTER};">
                &copy; ${year} ${escapeHtml(appName)}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, preheader, html, text };
}
