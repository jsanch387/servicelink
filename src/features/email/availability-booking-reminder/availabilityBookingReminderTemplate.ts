import {
  serviceLinkEmailDetailRow,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { AvailabilityBookingReminderPayload } from './types';

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

export function getAvailabilityBookingReminderSubject(
  businessName: string
): string {
  return `Reminder: your appointment with ${businessLabel(businessName)} is coming up`;
}

function bodyCopy(payload: AvailabilityBookingReminderPayload): string {
  const business = businessLabel(payload.businessName);
  const hello = greetingName(payload.customerName);
  const lead = hello ? `Hi ${hello}, this` : 'This';
  return `${lead} is a reminder that your appointment with ${business} is coming up.`;
}

export function buildAvailabilityBookingReminderPlainText(
  payload: AvailabilityBookingReminderPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Appointment';
  const when = `${formatDateLong(payload.scheduledDate)} at ${formatTimeHHmm(payload.startTime)}`;

  return [
    'Appointment reminder',
    '',
    bodyCopy(payload),
    '',
    `Service: ${service}`,
    `When: ${when}`,
    '',
    `Sent for ${business} via ServiceLink`,
  ].join('\n');
}

export function buildAvailabilityBookingReminderHtml(
  payload: AvailabilityBookingReminderPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Appointment';
  const when = `${formatDateLong(payload.scheduledDate)} at ${formatTimeHHmm(payload.startTime)}`;
  const year = new Date().getFullYear();

  return wrapServiceLinkEmail({
    title: 'Appointment reminder',
    heading: 'Appointment reminder',
    subtitle: bodyCopy(payload),
    bodyHtml: serviceLinkEmailSection(
      'Details',
      [
        serviceLinkEmailDetailRow('Service', service),
        serviceLinkEmailDetailRow('When', when, { isLast: true }),
      ].join('')
    ),
    footerHtml: `Sent for ${business} via ServiceLink.<br>&copy; ${year} ServiceLink.`,
  });
}
