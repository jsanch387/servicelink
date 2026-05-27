/**
 * When to discard saved DM state so a returning customer can start a new booking.
 */

import {
  hasCompleteCustomer,
  hasCompleteSchedule,
  isDetailsAskSent,
  isFinalRecapSent,
} from '@/services/meta/instagramDmBookingState';
import {
  getPreferredTimeFromNotes,
  type InstagramDmConversation,
} from '@/services/meta/instagramDmConversation';

/** After this idle period, the next message starts a fresh booking thread. */
export const CONVERSATION_INACTIVITY_RESET_MS = 48 * 60 * 60 * 1000;

const EXPLICIT_RESET_PATTERN =
  /\b(start over|start fresh|new (appointment|booking)|book again|different (car|truck|vehicle|service)|reset)\b/i;

const FRESH_OUTREACH_PATTERN =
  /\b(price|pricing|prices|how much|cost|menu|packages?|what do you (offer|charge)|saw your (post|ad|reel|story)|interested|get a quote|estimate|do you detail)\b/i;

const CONTINUATION_PATTERN =
  /^(yes|yeah|yep|yup|no|nope|ok|okay|sure|confirm|confirmed)\b|\b(\d{1,2}(:\d{2})?\s*(am|pm)|friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|next week|this week)\b|\b(change|instead|reschedule|different time|make it|can we do)\b/i;

export type ConversationResetReason =
  | 'explicit'
  | 'fresh_outreach'
  | 'inactivity'
  | 'prior_booking_confirmed';

export function hasAnyCollectedBookingState(
  conversation: InstagramDmConversation
): boolean {
  return Boolean(
    conversation.collectedService ||
      conversation.collectedVehicle ||
      conversation.collectedDate ||
      getPreferredTimeFromNotes(conversation.collectedNotes) ||
      isDetailsAskSent(conversation.collectedNotes) ||
      isFinalRecapSent(conversation.collectedNotes) ||
      conversation.bookingId ||
      conversation.stage !== 'greeting'
  );
}

export function hasPendingOrCompleteBooking(
  conversation: InstagramDmConversation
): boolean {
  if (
    conversation.stage === 'awaiting_confirmation' ||
    conversation.stage === 'collecting_customer' ||
    conversation.stage === 'ready_to_book' ||
    conversation.stage === 'booked'
  ) {
    return true;
  }
  if (isDetailsAskSent(conversation.collectedNotes)) {
    return true;
  }
  if (isFinalRecapSent(conversation.collectedNotes)) {
    return true;
  }
  return (
    hasCompleteSchedule(conversation, { requireVehicleFields: false }) &&
    hasCompleteCustomer(conversation)
  );
}

function isInactive(
  lastActivityAt: Date | null | undefined,
  now: Date
): boolean {
  if (!lastActivityAt) {
    return false;
  }
  return (
    now.getTime() - lastActivityAt.getTime() > CONVERSATION_INACTIVITY_RESET_MS
  );
}

export function getConversationResetReason(
  existing: InstagramDmConversation | null,
  messageText: string,
  options?: { now?: Date; lastActivityAt?: Date | null }
): ConversationResetReason | null {
  if (!existing || !hasAnyCollectedBookingState(existing)) {
    return null;
  }

  const trimmed = messageText.trim();
  const now = options?.now ?? new Date();

  if (EXPLICIT_RESET_PATTERN.test(trimmed)) {
    return 'explicit';
  }

  if (
    CONTINUATION_PATTERN.test(trimmed) &&
    !FRESH_OUTREACH_PATTERN.test(trimmed)
  ) {
    return null;
  }

  if (existing.bookingId && FRESH_OUTREACH_PATTERN.test(trimmed)) {
    return 'prior_booking_confirmed';
  }

  if (
    FRESH_OUTREACH_PATTERN.test(trimmed) &&
    hasPendingOrCompleteBooking(existing)
  ) {
    return 'fresh_outreach';
  }

  if (
    isInactive(options?.lastActivityAt, now) &&
    hasAnyCollectedBookingState(existing)
  ) {
    return 'inactivity';
  }

  return null;
}

export function shouldResetInstagramConversation(
  existing: InstagramDmConversation | null,
  messageText: string,
  options?: { now?: Date; lastActivityAt?: Date | null }
): boolean {
  return getConversationResetReason(existing, messageText, options) != null;
}
