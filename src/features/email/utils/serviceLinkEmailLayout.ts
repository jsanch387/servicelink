import { escapeHtml } from './escapeHtml';

export const SERVICE_LINK_EMAIL_FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const BG = '#0a0a0a';
const CARD_BG = '#151515';
const CARD_BORDER = '#262626';
const TEXT_PRIMARY = '#fafafa';
const TEXT_SECONDARY = '#a3a3a3';
const TEXT_MUTED = '#737373';
const TEXT_FOOTER = '#525252';
const INNER_BORDER = '#2a2a2a';

const WORD_WRAP =
  'word-break:break-word;overflow-wrap:break-word;-webkit-hyphens:auto;hyphens:auto;';

const SECTION_GAP = '24px';

const FONT_BODY = `font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;line-height:22px;font-weight:500;color:${TEXT_PRIMARY};`;
const FONT_BODY_MUTED = `font-family:${SERVICE_LINK_EMAIL_FONT};font-size:13px;line-height:20px;color:${TEXT_MUTED};`;
const FONT_BODY_SECONDARY = `font-family:${SERVICE_LINK_EMAIL_FONT};font-size:13px;line-height:20px;color:${TEXT_SECONDARY};`;
const FONT_PRICE = `font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;line-height:22px;font-weight:500;color:${TEXT_SECONDARY};`;

export function serviceLinkEmailDetailRow(
  label: string,
  value: string,
  options?: { isLast?: boolean }
): string {
  const paddingBottom = options?.isLast ? '0' : '14px';
  return `
    <tr class="email-detail-row">
      <td class="email-detail-label" style="padding:0 8px ${paddingBottom} 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:13px;line-height:20px;color:${TEXT_MUTED};vertical-align:top;width:34%;${WORD_WRAP}">
        ${escapeHtml(label)}
      </td>
      <td class="email-detail-value" style="padding:0 0 ${paddingBottom} 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;line-height:22px;color:${TEXT_PRIMARY};font-weight:500;text-align:right;vertical-align:top;width:66%;${WORD_WRAP}">
        ${escapeHtml(value)}
      </td>
    </tr>
  `.trim();
}

/** Name wraps on the left; price stays top-right in a fixed column. */
export function serviceLinkEmailPriceLineRow(
  label: string,
  value: string,
  options?: { isLast?: boolean; subLabel?: string; bullet?: boolean }
): string {
  const paddingBottom = options?.isLast ? '0' : '14px';
  const prefix = options?.bullet
    ? `<span style="color:${TEXT_MUTED};padding-right:8px;">&bull;</span>`
    : '';
  const labelBlock = options?.subLabel?.trim()
    ? `
        <div style="${FONT_BODY}${WORD_WRAP}">${prefix}${escapeHtml(label)}</div>
        <div style="margin-top:4px;${FONT_BODY_SECONDARY}${WORD_WRAP}">${escapeHtml(options.subLabel.trim())}</div>
      `.trim()
    : `<div style="${FONT_BODY}${WORD_WRAP}">${prefix}${escapeHtml(label)}</div>`;

  return `
    <tr class="email-price-line">
      <td colspan="2" style="padding:0 0 ${paddingBottom} 0;font-family:${SERVICE_LINK_EMAIL_FONT};">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="email-price-label" style="padding:0 12px 0 0;vertical-align:top;${WORD_WRAP}">
              ${labelBlock}
            </td>
            <td class="email-price-amount" style="width:76px;vertical-align:top;${FONT_PRICE}text-align:right;white-space:nowrap;">
              ${escapeHtml(value)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `.trim();
}

export function serviceLinkEmailPriceTotalRow(
  label: string,
  value: string
): string {
  return `
    <tr class="email-price-total">
      <td colspan="2" style="padding:16px 0 0 0;border-top:1px solid ${INNER_BORDER};font-family:${SERVICE_LINK_EMAIL_FONT};">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding:0 12px 0 0;vertical-align:top;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;font-weight:600;line-height:22px;color:${TEXT_PRIMARY};${WORD_WRAP}">${escapeHtml(label)}</td>
            <td style="width:76px;vertical-align:top;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;font-weight:600;line-height:22px;color:${TEXT_PRIMARY};text-align:right;white-space:nowrap;">${escapeHtml(value)}</td>
          </tr>
        </table>
      </td>
    </tr>
  `.trim();
}

/** Service, option, add-ons, and line-item prices in one card (no duplicate sections). */
export function serviceLinkEmailServiceAndPricingContent(params: {
  serviceName: string;
  optionLabel?: string;
  lineItems: Array<{ label: string; price: string; isAddOn?: boolean }>;
  totalLabel?: string | null;
}): string {
  const { lineItems, totalLabel } = params;
  const hasServiceLine = lineItems.some(item => !item.isAddOn);
  const rows: string[] = [];

  if (!hasServiceLine && lineItems.length > 0) {
    const headerParts = [
      `<div style="${FONT_BODY}${WORD_WRAP}">${escapeHtml(params.serviceName)}</div>`,
    ];
    if (params.optionLabel?.trim()) {
      headerParts.push(
        `<div style="margin-top:4px;${FONT_BODY_SECONDARY}${WORD_WRAP}">${escapeHtml(params.optionLabel.trim())}</div>`
      );
    }
    rows.push(
      `
      <tr>
        <td colspan="2" style="padding:0 0 14px 0;font-family:${SERVICE_LINK_EMAIL_FONT};">
          ${headerParts.join('')}
        </td>
      </tr>
    `.trim()
    );
  }

  if (lineItems.length === 0) {
    const headerParts = [
      `<div style="${FONT_BODY}${WORD_WRAP}">${escapeHtml(params.serviceName)}</div>`,
    ];
    if (params.optionLabel?.trim()) {
      headerParts.push(
        `<div style="margin-top:4px;${FONT_BODY_SECONDARY}${WORD_WRAP}">${escapeHtml(params.optionLabel.trim())}</div>`
      );
    }
    return `
      <tr>
        <td colspan="2" style="padding:0;font-family:${SERVICE_LINK_EMAIL_FONT};">
          ${headerParts.join('')}
        </td>
      </tr>
    `.trim();
  }

  lineItems.forEach((item, i) => {
    const isFirst = i === 0;
    const isLast = i === lineItems.length - 1 && !totalLabel;
    rows.push(
      serviceLinkEmailPriceLineRow(item.label, item.price, {
        isLast,
        bullet: item.isAddOn,
        subLabel: isFirst && !item.isAddOn ? params.optionLabel : undefined,
      })
    );
  });

  if (totalLabel) {
    rows.push(serviceLinkEmailPriceTotalRow('Appointment total', totalLabel));
  }

  return rows.join('');
}

export function serviceLinkEmailSection(
  title: string,
  rowsHtml: string,
  options?: { isFirst?: boolean }
): string {
  if (!rowsHtml.trim()) return '';
  const marginTop = options?.isFirst ? '0' : SECTION_GAP;
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-section" style="margin-top:${marginTop};">
      <tr>
        <td style="padding:0 0 8px 2px;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;font-weight:600;line-height:20px;color:${TEXT_PRIMARY};text-align:left;">
          ${escapeHtml(title)}
        </td>
      </tr>
      <tr>
        <td class="email-section-card-pad" style="background-color:${CARD_BG};border:1px solid ${INNER_BORDER};border-radius:14px;padding:14px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-section-card">
            ${rowsHtml}
          </table>
        </td>
      </tr>
    </table>
  `.trim();
}

export function serviceLinkEmailParagraph(text: string): string {
  return `<p style="margin:0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:15px;line-height:24px;color:${TEXT_SECONDARY};">${escapeHtml(text)}</p>`;
}

export function serviceLinkEmailFootnote(text: string): string {
  return `<p style="margin:14px 0 0 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:13px;line-height:20px;color:${TEXT_MUTED};">${escapeHtml(text)}</p>`;
}

export function serviceLinkEmailCta(href: string, label: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto 0 auto;">
      <tr>
        <td align="center" bgcolor="#ffffff" style="border-radius:12px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 24px;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:15px;font-weight:600;line-height:20px;color:#000000 !important;text-decoration:none !important;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

const RESPONSIVE_STYLES = `
  .email-container {
    max-width: 600px !important;
    width: 100% !important;
  }
  @media screen and (min-width: 600px) {
    .email-outer-pad {
      padding: 36px 12px !important;
    }
    .email-main-card {
      padding: 32px 20px 28px 20px !important;
    }
    .email-section-card-pad {
      padding: 14px 14px !important;
    }
  }
  @media screen and (max-width: 520px) {
    .email-outer-pad {
      padding: 24px 10px !important;
    }
    .email-main-card {
      padding: 24px 14px 22px 14px !important;
    }
    .email-section-card-pad {
      padding: 14px 12px !important;
    }
    .email-section-card {
      width: 100% !important;
    }
    .email-detail-row .email-detail-label,
    .email-detail-row .email-detail-value {
      display: block !important;
      width: 100% !important;
      padding-right: 0 !important;
    }
    .email-detail-row .email-detail-value {
      text-align: left !important;
      margin-top: 4px !important;
      padding-bottom: 14px !important;
    }
    .email-price-label {
      padding-right: 8px !important;
    }
    .email-price-amount {
      width: 64px !important;
    }
  }
`.trim();

export function wrapServiceLinkEmail(params: {
  title: string;
  heading: string;
  subtitle: string;
  bodyHtml: string;
  footerHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(params.title)}</title>
  <style type="text/css">${RESPONSIVE_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:${BG};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG};">
    <tr>
      <td align="center" class="email-outer-pad" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width:600px;width:100%;margin:0 auto;">
          <tr>
            <td style="padding:0 0 28px 0;text-align:center;">
              <span style="font-family:${SERVICE_LINK_EMAIL_FONT};font-size:20px;font-weight:600;letter-spacing:-0.4px;color:${TEXT_PRIMARY};">ServiceLink</span>
            </td>
          </tr>
          <tr>
            <td class="email-main-card" style="background-color:${CARD_BG};border:1px solid ${CARD_BORDER};border-radius:20px;padding:28px 20px 28px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 0 8px 0;">
                    <h1 style="margin:0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:22px;font-weight:600;letter-spacing:-0.5px;line-height:28px;color:${TEXT_PRIMARY};">
                      ${escapeHtml(params.heading)}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 24px 0;">
                    ${serviceLinkEmailParagraph(params.subtitle)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    ${params.bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 8px 0 8px;text-align:center;">
              <p style="margin:0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:12px;line-height:18px;color:${TEXT_FOOTER};">
                ${params.footerHtml}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
