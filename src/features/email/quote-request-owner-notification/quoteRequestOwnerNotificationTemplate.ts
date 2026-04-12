/**
 * HTML template for the "new quote request" email to the business owner.
 * Layout matches `availability-booking-notification/availabilityBookingNotificationTemplate.ts`
 * (V2 appointment emails: same wrapper, cards, typography, full-width CTA, ServiceLink footer).
 */

import { escapeHtml } from '../utils/escapeHtml';
import type { QuoteRequestOwnerNotificationPayload } from './types';

function detailRow(label: string, value: string): string {
  const valueHtml = escapeHtml(value).replace(/\r?\n/g, '<br />');
  return `
              <tr>
                <td class="detail-label" style="padding-bottom: 12px;">${escapeHtml(label)}</td>
                <td class="detail-value" style="padding-bottom: 12px;">${valueHtml}</td>
              </tr>`;
}

/** Long textarea-style copy: label on its own line, full-width value beneath (not right column). */
function detailBlockRow(label: string, value: string): string {
  const valueHtml = escapeHtml(value).replace(/\r?\n/g, '<br />');
  return `
              <tr>
                <td colspan="2" style="padding-bottom: 12px; text-align: left; vertical-align: top;">
                  <div class="detail-label" style="margin-bottom: 8px;">${escapeHtml(label)}</div>
                  <div style="font-size: 14px; font-weight: 500; color: #1e293b; line-height: 1.55; text-align: left; word-wrap: break-word; overflow-wrap: anywhere;">${valueHtml}</div>
                </td>
              </tr>`;
}

export function getQuoteRequestOwnerNotificationSubject(
  customerName: string
): string {
  return `New quote request from ${customerName}`;
}

export function buildQuoteRequestOwnerNotificationHtml(
  payload: QuoteRequestOwnerNotificationPayload,
  dashboardQuoteRequestUrl: string
): string {
  const rows: string[] = [
    detailRow('Customer', payload.customerName),
    detailRow('Service', payload.serviceName),
  ];
  if (payload.vehicleSummary?.trim()) {
    rows.push(detailRow('Vehicle', payload.vehicleSummary.trim()));
  }
  if (payload.timeline?.trim()) {
    rows.push(detailRow('Preferred timing', payload.timeline.trim()));
  }
  rows.push(detailBlockRow('Details', payload.detailsPreview));

  const requestCardRows = rows.join('');

  const footerHtml = `This email was sent because a customer submitted a quote request on your profile.<br>
          &copy; ${new Date().getFullYear()} ServiceLink.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote request</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7f9;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f7f9;
      padding-bottom: 40px;
    }

    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      color: #4a4a4a;
    }

    .header { padding: 30px; text-align: center; background-color: #ffffff; }
    .hero { padding: 10px 30px 30px 30px; text-align: center; }
    .content { padding: 0 30px 40px 30px; }

    .card {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 16px;
    }

    .detail-label { font-size: 14px; color: #64748b; }
    .detail-value { font-size: 14px; font-weight: 500; color: #1e293b; text-align: right; }

    .button {
      background-color: #2563eb;
      border-radius: 8px;
      color: #ffffff !important;
      display: inline-block;
      font-size: 16px;
      font-weight: 600;
      line-height: 50px;
      text-align: center;
      text-decoration: none;
      width: 100%;
    }

    .footer {
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }

    @media screen and (max-width: 600px) {
      .content { padding: 0 20px 30px 20px; }
      .card { padding: 16px; }
    }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main">
      <tr>
        <td class="header">
          <div style="height: 20px;"></div>
        </td>
      </tr>

      <tr>
        <td class="hero">
          <h1 style="font-size:26px;margin:0;color:#1e293b;letter-spacing:-0.02em;">New quote request</h1>
          <p style="font-size:16px;color:#64748b;margin-top:8px;">You have a new request from your public profile. Here are the details:</p>
        </td>
      </tr>

      <tr>
        <td class="content">
          <div class="card">
            <div class="section-title">Request summary</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              ${requestCardRows}
            </table>
          </div>

          <a href="${escapeHtml(dashboardQuoteRequestUrl)}" class="button">View quote request</a>
        </td>
      </tr>

      <tr>
        <td class="footer">
          ${footerHtml}
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`.trim();
}
