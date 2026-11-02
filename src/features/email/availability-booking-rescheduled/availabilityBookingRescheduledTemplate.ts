import {
  serviceLinkEmailDetailRow,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { AvailabilityBookingRescheduledPayload } from './types';

function businessLabel(businessName: string): string {
  return businessName.trim() || 'your provider';
}

function greetingName(customerName: string | null | undefined): string | null {
  const name = customerName?.trim();
  return name || null;
}

function formatTimeHHmm(hhmm: string): string {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return hhmm.trim();
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${min} ${ampm}`;
}

function formatDateLong(dateStr: string): string {
  const date = new Date(`${dateStr.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr.trim();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWhen(dateStr: string, timeStr: string): string {
  return `${formatDateLong(dateStr)} at ${formatTimeHHmm(timeStr)}`;
}

export function getAvailabilityBookingRescheduledSubject(
  businessName: string
): string {
  return `Your appointment with ${businessLabel(businessName)} was rescheduled`;
}

function bodyCopy(payload: AvailabilityBookingRescheduledPayload): string {
  const business = businessLabel(payload.businessName);
  const hello = greetingName(payload.customerName);
  const lead = hello ? `Hi ${hello}, your` : 'Your';
  return `${lead} appointment with ${business} has been rescheduled.`;
}

export function buildAvailabilityBookingRescheduledPlainText(
  payload: AvailabilityBookingRescheduledPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Appointment';
  const when = formatWhen(payload.scheduledDate, payload.startTime);
  const previousDate = payload.previousScheduledDate?.trim() || '';
  const previousTime = payload.previousStartTime?.trim() || '';
  const lines = [
    'Appointment rescheduled',
    '',
    bodyCopy(payload),
    '',
    `Service: ${service}`,
    `New time: ${when}`,
  ];
  if (previousDate && previousTime) {
    lines.push(`Previously: ${formatWhen(previousDate, previousTime)}`);
  }
  lines.push('', `Sent for ${business} via ServiceLink`);
  return lines.join('\n');
}

export function buildAvailabilityBookingRescheduledHtml(
  payload: AvailabilityBookingRescheduledPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Appointment';
  const when = formatWhen(payload.scheduledDate, payload.startTime);
  const previousDate = payload.previousScheduledDate?.trim() || '';
  const previousTime = payload.previousStartTime?.trim() || '';
  const year = new Date().getFullYear();
  const rows = [
    serviceLinkEmailDetailRow('Service', service),
    serviceLinkEmailDetailRow('New time', when, {
      isLast: !(previousDate && previousTime),
    }),
  ];
  if (previousDate && previousTime) {
    rows.push(
      serviceLinkEmailDetailRow(
        'Previously',
        formatWhen(previousDate, previousTime),
        { isLast: true }
      )
    );
  }

  return wrapServiceLinkEmail({
    title: 'Appointment rescheduled',
    heading: 'Appointment rescheduled',
    subtitle: bodyCopy(payload),
    bodyHtml: serviceLinkEmailSection('Details', rows.join('')),
    footerHtml: `Sent for ${business} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
