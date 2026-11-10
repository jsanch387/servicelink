import {
  serviceLinkEmailDetailRow,
  serviceLinkEmailSection,
  wrapServiceLinkEmail,
} from '../utils/serviceLinkEmailLayout';
import type { AvailabilityBookingRequestDeniedPayload } from './types';

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

export function getAvailabilityBookingRequestDeniedSubject(): string {
  return 'Your appointment request was not confirmed';
}

function bodyCopy(payload: AvailabilityBookingRequestDeniedPayload): string {
  const business = businessLabel(payload.businessName);
  const hello = greetingName(payload.customerName);
  const lead = hello ? `Hi ${hello}, your` : 'Your';
  return `${lead} appointment request with ${business} was not confirmed. That time is no longer held.`;
}

export function buildAvailabilityBookingRequestDeniedPlainText(
  payload: AvailabilityBookingRequestDeniedPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Appointment';
  const when = `${formatDateLong(payload.scheduledDate)} at ${formatTimeHHmm(payload.startTime)}`;

  return [
    'Request not confirmed',
    '',
    bodyCopy(payload),
    '',
    `Service: ${service}`,
    `When: ${when}`,
    '',
    `Sent for ${business} via ServiceLink`,
  ].join('\n');
}

export function buildAvailabilityBookingRequestDeniedHtml(
  payload: AvailabilityBookingRequestDeniedPayload
): string {
  const business = businessLabel(payload.businessName);
  const service = payload.serviceName.trim() || 'Appointment';
  const when = `${formatDateLong(payload.scheduledDate)} at ${formatTimeHHmm(payload.startTime)}`;
  const year = new Date().getFullYear();

  return wrapServiceLinkEmail({
    title: 'Request not confirmed',
    heading: 'Request not confirmed',
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
