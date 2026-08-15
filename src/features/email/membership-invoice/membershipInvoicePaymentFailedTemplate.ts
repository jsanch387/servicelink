import { escapeHtml } from '../utils/escapeHtml';
import {
  formatInvoiceMoney,
  receiptRowsHtml,
} from './membershipInvoiceEmailShared';
import type { MembershipInvoiceEmailPayload } from './types';

export function getMembershipInvoicePaymentFailedSubject(
  businessName: string
): string {
  const name = businessName.trim() || 'your membership';
  return `Payment failed — ${name}`;
}

export function buildMembershipInvoicePaymentFailedPlainText(
  payload: MembershipInvoiceEmailPayload
): string {
  const business = payload.businessName.trim() || 'the business';
  const plan = payload.planName.trim() || 'your plan';
  const money = formatInvoiceMoney(payload.amountCents);
  const hello = payload.customerName?.trim()
    ? `Hi ${payload.customerName.trim()},`
    : 'Hi,';

  return [
    hello,
    '',
    `We couldn’t charge your card for ${plan} with ${business}.`,
    'Update your payment method so your membership stays active.',
    '',
    `Amount due: ${money}`,
    `Plan: ${plan}`,
    `Schedule: ${payload.cadenceLabel.trim() || 'Recurring'}`,
    `Period: ${payload.periodLabel.trim() || '—'}`,
    `Attempted: ${payload.eventDateLabel.trim() || '—'}`,
    '',
    'Update payment method:',
    payload.manageUrl.trim(),
    '',
    `Sent for ${business} via ServiceLink`,
  ].join('\n');
}

export function buildMembershipInvoicePaymentFailedHtml(
  payload: MembershipInvoiceEmailPayload
): string {
  const business = escapeHtml(payload.businessName.trim() || 'Your membership');
  const plan = escapeHtml(payload.planName.trim() || 'Your plan');
  const money = escapeHtml(formatInvoiceMoney(payload.amountCents));
  const manageUrl = escapeHtml(payload.manageUrl.trim());
  const hello = payload.customerName?.trim()
    ? `Hi ${escapeHtml(payload.customerName.trim())},`
    : 'Hi,';
  const subject = escapeHtml(
    getMembershipInvoicePaymentFailedSubject(payload.businessName)
  );
  const rows = receiptRowsHtml({
    planName: payload.planName,
    cadenceLabel: payload.cadenceLabel,
    periodLabel: payload.periodLabel,
    eventDateLabel: payload.eventDateLabel,
    eventDateLabelKey: 'Attempted',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;padding:28px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#71717a;">${business}</p>
              <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#18181b;font-weight:800;letter-spacing:-0.02em;">Payment failed</h1>

              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#18181b;">${hello}</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#3f3f46;">
                We couldn’t charge your card for <strong style="color:#18181b;">${plan}</strong>.
                Update your payment method so your membership stays active.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#a16207;">Amount due</p>
                    <p style="margin:0 0 14px;font-size:22px;font-weight:800;color:#18181b;letter-spacing:-0.02em;">${money}</p>
                    ${rows}
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#71717a;">
                Update your card in the membership portal. Once payment succeeds, your plan continues as usual.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
                <tr>
                  <td style="border-radius:10px;background-color:#0a0a0a;">
                    <a href="${manageUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
                      Update payment method
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;padding-top:18px;border-top:1px solid #f4f4f5;font-size:11px;line-height:1.5;color:#a1a1aa;">
                Sent for ${business} via ServiceLink
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
