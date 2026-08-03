/**
 * Receipt-style jobs card for booking confirmation + job-completed emails.
 * Omits missing option, vehicle, duration, and add-ons so layout stays tight.
 */

import { escapeHtml } from './escapeHtml';
import { formatDurationForEmail } from './formatDurationForEmail';
import { SERVICE_LINK_EMAIL_FONT } from './serviceLinkEmailLayout';

export interface EmailJobsReceiptAddOn {
  name: string;
  priceCents: number;
}

export interface EmailJobsReceiptJob {
  serviceName: string;
  servicePriceOptionLabel?: string | null;
  servicePriceCents?: number | null;
  selectedAddOns?: EmailJobsReceiptAddOn[];
  durationMinutes?: number | null;
  customerVehicleYear?: string | null;
  customerVehicleMake?: string | null;
  customerVehicleModel?: string | null;
}

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function vehicleLine(job: EmailJobsReceiptJob): string | null {
  const parts = [
    job.customerVehicleYear?.trim(),
    job.customerVehicleMake?.trim(),
    job.customerVehicleModel?.trim(),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * HTML rows for a Jobs section card. Empty string when no jobs.
 */
export function buildEmailJobsReceiptCardHtml(
  jobs: EmailJobsReceiptJob[] | null | undefined
): string {
  if (!jobs?.length) return '';

  const blocks: string[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const optionLabel = job.servicePriceOptionLabel?.trim() || '';
    const vehicle = vehicleLine(job);
    const addOns = job.selectedAddOns ?? [];
    const serviceCents =
      job.servicePriceCents != null && Number.isFinite(job.servicePriceCents)
        ? job.servicePriceCents
        : 0;
    const durationMinutes =
      job.durationMinutes != null &&
      Number.isFinite(job.durationMinutes) &&
      job.durationMinutes > 0
        ? job.durationMinutes
        : null;
    const durationLabel =
      durationMinutes != null ? formatDurationForEmail(durationMinutes) : null;
    const metaParts = [vehicle, durationLabel].filter(Boolean) as string[];
    const isLastJob = i === jobs.length - 1;
    const hasAddOns = addOns.length > 0;
    const metaPad = hasAddOns ? '8px' : isLastJob ? '0' : '14px';

    const serviceNameHtml = optionLabel
      ? `${escapeHtml(job.serviceName)}<br /><span style="color:#737373;font-size:12px;line-height:18px;">${escapeHtml(optionLabel)}</span>`
      : escapeHtml(job.serviceName);

    let block = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:0 12px 2px 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;line-height:20px;font-weight:400;color:#fafafa;vertical-align:top;">
            ${serviceNameHtml}
          </td>
          <td style="padding:0 0 2px 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:14px;line-height:20px;font-weight:400;color:#fafafa;text-align:right;white-space:nowrap;vertical-align:top;">
            ${escapeHtml(formatPriceCents(serviceCents))}
          </td>
        </tr>
    `;

    if (metaParts.length > 0) {
      block += `
        <tr>
          <td colspan="2" style="padding:0 0 ${metaPad} 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:13px;line-height:20px;font-weight:400;color:#737373;">
            ${escapeHtml(metaParts.join(' · '))}
          </td>
        </tr>
      `;
    } else if (!hasAddOns && !isLastJob) {
      block += `
        <tr>
          <td colspan="2" style="padding:0 0 14px 0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      `;
    }

    for (let a = 0; a < addOns.length; a++) {
      const addOn = addOns[a];
      const addOnLast = a === addOns.length - 1;
      const addOnPad =
        addOnLast && isLastJob ? '0' : addOnLast ? '14px' : '6px';
      block += `
        <tr>
          <td style="padding:0 12px ${addOnPad} 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:13px;line-height:20px;font-weight:400;color:#a3a3a3;">
            ${escapeHtml(addOn.name)}
          </td>
          <td style="padding:0 0 ${addOnPad} 0;font-family:${SERVICE_LINK_EMAIL_FONT};font-size:13px;line-height:20px;font-weight:400;color:#a3a3a3;text-align:right;white-space:nowrap;">
            ${escapeHtml(formatPriceCents(addOn.priceCents))}
          </td>
        </tr>
      `;
    }

    block += `</table>`;
    blocks.push(block.trim());

    if (!isLastJob) {
      blocks.push(
        `<div style="border-top:1px solid #2a2a2a;margin:0 0 14px 0;"></div>`
      );
    }
  }

  return blocks.join('');
}
