import {
  formatVehicleLabel,
  getCustomerGaps,
  type CustomerGap,
} from '@/services/meta/instagramDmBookingState';
import type { InstagramDmConversation } from '@/services/meta/instagramDmConversation';
import { getPreferredTimeFromNotes } from '@/services/meta/instagramDmConversation';
import type { InstagramBusinessContext } from '@/services/meta/loadInstagramBusinessContext';

const AFFIRMATIVE_PATTERN =
  /^(yes|yeah|yep|yup|correct|that's right|thats right|sounds good|looks good|all good|works for me|that works|confirm|confirmed|ok|okay|sure|perfect|go ahead|let's do it|lets do it|book it|lock it in)\b/i;

const NEGATIVE_PATTERN = /^(no|nope|not quite|change|wrong|different)\b/i;

export function isAffirmativeConfirmation(messageText: string): boolean {
  return AFFIRMATIVE_PATTERN.test(messageText.trim());
}

export function isNegativeConfirmation(messageText: string): boolean {
  return NEGATIVE_PATTERN.test(messageText.trim());
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function findServicePrice(
  context: InstagramBusinessContext,
  serviceName: string | null
): string | null {
  if (!serviceName?.trim()) {
    return null;
  }
  const match = context.services.find(
    s => s.name.toLowerCase() === serviceName.trim().toLowerCase()
  );
  if (!match?.basePriceCents) {
    return null;
  }
  return `$${(match.basePriceCents / 100).toFixed(0)}`;
}

function formatAddressLine(conversation: InstagramDmConversation): string {
  const parts = [
    conversation.collectedStreet,
    conversation.collectedUnit,
    [conversation.collectedCity, conversation.collectedState]
      .filter(Boolean)
      .join(', '),
    conversation.collectedZip,
  ].filter(p => p?.trim());
  return parts.join(' ').trim() || 'your place';
}

function scheduleSnippet(
  context: InstagramBusinessContext,
  conversation: InstagramDmConversation
): string {
  const service = conversation.collectedService ?? 'your detail';
  const vehicle = formatVehicleLabel(conversation);
  const date = conversation.collectedDate
    ? formatDisplayDate(conversation.collectedDate)
    : 'your day';
  const time =
    getPreferredTimeFromNotes(conversation.collectedNotes) ?? 'your time';
  const price = findServicePrice(context, conversation.collectedService);
  const pricePart = price ? ` (${price})` : '';
  return `${service}${pricePart} for your ${vehicle}, ${date} at ${time}`;
}

/**
 * One casual ask for delivery-style info (address + name + phone) — like ordering pizza.
 */
export function buildReceptionistDetailsAskReply(
  context: InstagramBusinessContext,
  conversation: InstagramDmConversation
): string {
  const order = scheduleSnippet(context, conversation);
  return `Perfect — I've got ${order}. Where should we come to you, and what name and number should I put on the appointment?`;
}

function followUpForGap(
  gap: CustomerGap,
  conversation: InstagramDmConversation
): string {
  const firstName = conversation.collectedName?.trim().split(/\s+/)[0];
  switch (gap) {
    case 'address':
      return "Got it — what's the address we'll be coming to?";
    case 'zip':
      return 'And what ZIP is that?';
    case 'city_state':
      return 'What city and state is that in?';
    case 'name':
      return firstName
        ? `Thanks — and a good phone number for ${firstName}?`
        : 'What name should I put on the appointment?';
    case 'phone':
      return "What's the best number to reach you?";
    default:
      return 'What else do you need me to add for the booking?';
  }
}

/** Short nudge when they replied but we're still missing a piece. */
export function buildConversationalFollowUpReply(
  conversation: InstagramDmConversation
): string | null {
  const gaps = getCustomerGaps(conversation);
  if (gaps.length === 0) {
    return null;
  }

  if (gaps.includes('address')) {
    return followUpForGap('address', conversation);
  }
  if (gaps.includes('zip') && gaps.length === 1) {
    return followUpForGap('zip', conversation);
  }
  if (gaps.includes('city_state') && gaps.length <= 2) {
    return followUpForGap('city_state', conversation);
  }
  if (gaps.includes('name') && !gaps.includes('phone')) {
    return followUpForGap('name', conversation);
  }
  if (gaps.includes('phone')) {
    return followUpForGap('phone', conversation);
  }

  return followUpForGap(gaps[0], conversation);
}

/** Single read-back before booking — like confirming a takeout order. */
export function buildFinalRecapReply(
  context: InstagramBusinessContext,
  conversation: InstagramDmConversation
): string {
  const order = scheduleSnippet(context, conversation);
  const address = formatAddressLine(conversation);
  const name = conversation.collectedName?.trim() ?? 'you';
  const phone = conversation.collectedPhone?.trim() ?? '';

  const contactPart = phone ? `${name}, ${phone}` : name;

  return `Alright — ${order}, at ${address}, under ${contactPart}. Want me to get that on the schedule for you?`;
}
