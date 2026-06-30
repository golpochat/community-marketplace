import { BRAND_COLORS, emailFontStack, escapeHtml } from './brand';

export interface EmailLayoutInput {
  subject: string;
  preheader: string;
  headerTitle: string;
  headerSubtitle: string;
  bodyHtml: string;
  footerHtml: string;
}

export function buildBrandedEmailHtml(input: EmailLayoutInput): string {
  const font = emailFontStack();
  const c = BRAND_COLORS;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(input.subject)}</title>
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
<body style="margin:0;padding:0;width:100%;background-color:${c.surfacePage};">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${c.surfacePage};">
    ${escapeHtml(input.preheader)}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${c.surfacePage};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="width:600px;max-width:600px;background-color:${c.surfaceCard};border-radius:12px;overflow:hidden;border:1px solid ${c.borderSubtle};">
          <tr>
            <td class="email-header-cell" align="center" style="padding:32px 40px;background:linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%);">
              <p style="margin:0;font-family:${font};font-size:26px;font-weight:700;line-height:1.2;color:${c.white};letter-spacing:-0.02em;">
                ${escapeHtml(input.headerTitle)}
              </p>
              <p style="margin:8px 0 0;font-family:${font};font-size:14px;line-height:1.4;color:rgba(255,255,255,0.92);">
                ${escapeHtml(input.headerSubtitle)}
              </p>
            </td>
          </tr>
          <tr>
            <td class="email-body-cell" style="padding:40px;font-family:${font};">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="email-footer-cell" style="padding:24px 40px;background-color:${c.surfaceFooter};border-top:1px solid ${c.borderSubtle};font-family:${font};">
              ${input.footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildEmailCtaButton(label: string, href: string): string {
  const c = BRAND_COLORS;
  const font = emailFontStack();
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:${c.primary};">
        <a href="${safeHref}" target="_blank" class="cta-button" style="display:inline-block;padding:14px 32px;font-family:${font};font-size:16px;font-weight:600;line-height:1.2;color:${c.white};text-decoration:none;border-radius:8px;background-color:${c.primary};">
          ${safeLabel}
        </a>
      </td>
    </tr>
  </table>`;
}
