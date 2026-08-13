import { escapeHtml } from '../utils/escapeHtml';

export function formatInvoiceMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, cents) / 100);
}

export function formatInvoiceDateLabel(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatInvoicePeriodLabel(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): string {
  const start = formatInvoiceDateLabel(startIso);
  const end = formatInvoiceDateLabel(endIso);
  if (start === '—' && end === '—') return '—';
  if (start === '—') return end;
  if (end === '—') return start;
  return `${start} – ${end}`;
}

export function receiptRowsHtml(args: {
  planName: string;
  cadenceLabel: string;
  periodLabel: string;
  eventDateLabel: string;
  eventDateLabelKey: string;
}): string {
  const plan = escapeHtml(args.planName.trim() || 'Your plan');
  const cadence = escapeHtml(args.cadenceLabel.trim() || 'Recurring');
  const period = escapeHtml(args.periodLabel.trim() || '—');
  const eventDate = escapeHtml(args.eventDateLabel.trim() || '—');
  const eventKey = escapeHtml(args.eventDateLabelKey);

  const row = (label: string, value: string, last = false) => `
    <tr>
      <td style="padding:0 ${last ? '0' : '0 0 8px'};font-size:13px;color:#71717a;width:40%;">${label}</td>
      <td style="padding:0 ${last ? '0' : '0 0 8px'};font-size:13px;color:#18181b;font-weight:600;text-align:right;">${value}</td>
    </tr>`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${row('Plan', plan)}
      ${row('Schedule', cadence)}
      ${row('Period', period)}
      ${row(eventKey, eventDate, true)}
    </table>`;
}
