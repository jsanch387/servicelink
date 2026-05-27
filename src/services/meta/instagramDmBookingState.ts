/**
 * Booking collection phases — receptionist-style (talking, not forms).
 */

import type { InstagramDmConversation } from '@/services/meta/instagramDmConversation';
import { getPreferredTimeFromNotes } from '@/services/meta/instagramDmConversation';

export function isDetailsAskSent(notes: string | null | undefined): boolean {
  return /details_ask_sent:\s*yes/i.test(notes ?? '');
}

export function isFinalRecapSent(notes: string | null | undefined): boolean {
  return /final_recap_sent:\s*yes/i.test(notes ?? '');
}

export function markDetailsAskSentInNotes(
  notes: string | null | undefined
): string {
  const base = (notes ?? '').trim();
  if (isDetailsAskSent(base)) {
    return base;
  }
  return base ? `details_ask_sent: yes; ${base}` : 'details_ask_sent: yes';
}

export function markFinalRecapSentInNotes(
  notes: string | null | undefined
): string {
  const base = (notes ?? '').trim();
  if (isFinalRecapSent(base)) {
    return base;
  }
  return base ? `final_recap_sent: yes; ${base}` : 'final_recap_sent: yes';
}

/** @deprecated Legacy flags — still read for old rows */
export function isScheduleRecapSent(notes: string | null | undefined): boolean {
  return /(?:schedule_recap_sent|confirmation_sent):\s*yes/i.test(notes ?? '');
}

export function isScheduleConfirmed(notes: string | null | undefined): boolean {
  return (
    /schedule_confirmed:\s*yes/i.test(notes ?? '') ||
    isDetailsAskSent(notes) ||
    isScheduleRecapSent(notes)
  );
}

export function formatVehicleLabel(
  conversation: InstagramDmConversation
): string {
  const y = conversation.collectedVehicleYear?.trim();
  const mk = conversation.collectedVehicleMake?.trim();
  const md = conversation.collectedVehicleModel?.trim();
  if (y && mk && md) {
    return `${y} ${mk} ${md}`;
  }
  return conversation.collectedVehicle?.trim() || 'your vehicle';
}

export function hasCompleteVehicle(
  conversation: Pick<
    InstagramDmConversation,
    | 'collectedVehicle'
    | 'collectedVehicleYear'
    | 'collectedVehicleMake'
    | 'collectedVehicleModel'
  >,
  options: { requireVehicleFields: boolean }
): boolean {
  if (options.requireVehicleFields) {
    return Boolean(
      conversation.collectedVehicleYear?.trim() &&
        conversation.collectedVehicleMake?.trim() &&
        conversation.collectedVehicleModel?.trim()
    );
  }
  return Boolean(conversation.collectedVehicle?.trim());
}

export function hasCompleteSchedule(
  conversation: Pick<
    InstagramDmConversation,
    | 'collectedService'
    | 'collectedVehicle'
    | 'collectedDate'
    | 'collectedNotes'
    | 'collectedVehicleYear'
    | 'collectedVehicleMake'
    | 'collectedVehicleModel'
  >,
  options: { requireVehicleFields: boolean }
): boolean {
  return Boolean(
    conversation.collectedService?.trim() &&
      conversation.collectedDate?.trim() &&
      getPreferredTimeFromNotes(conversation.collectedNotes) &&
      hasCompleteVehicle(conversation, options)
  );
}

export function hasCompleteCustomer(
  conversation: Pick<
    InstagramDmConversation,
    | 'collectedName'
    | 'collectedPhone'
    | 'collectedStreet'
    | 'collectedCity'
    | 'collectedState'
    | 'collectedZip'
  >
): boolean {
  return Boolean(
    conversation.collectedName?.trim() &&
      conversation.collectedPhone?.trim() &&
      conversation.collectedStreet?.trim() &&
      conversation.collectedCity?.trim() &&
      conversation.collectedState?.trim() &&
      conversation.collectedZip?.trim()
  );
}

export function isReadyToCreateBooking(
  conversation: InstagramDmConversation,
  options: { requireVehicleFields: boolean }
): boolean {
  if (conversation.bookingId) {
    return false;
  }
  return (
    hasCompleteSchedule(conversation, options) &&
    hasCompleteCustomer(conversation)
  );
}

export type ScheduleGap = 'service' | 'vehicle' | 'when';

export function getScheduleGap(
  conversation: InstagramDmConversation | null,
  options: { requireVehicleFields: boolean }
): ScheduleGap | null {
  if (!conversation?.collectedService?.trim()) {
    return 'service';
  }
  if (!hasCompleteVehicle(conversation, options)) {
    return 'vehicle';
  }
  if (
    !conversation.collectedDate?.trim() ||
    !getPreferredTimeFromNotes(conversation.collectedNotes)
  ) {
    return 'when';
  }
  return null;
}

export type CustomerGap = 'address' | 'name' | 'phone' | 'zip' | 'city_state';

export function getCustomerGaps(
  conversation: InstagramDmConversation
): CustomerGap[] {
  const gaps: CustomerGap[] = [];
  const hasStreet = Boolean(conversation.collectedStreet?.trim());
  const hasCity = Boolean(conversation.collectedCity?.trim());
  const hasState = Boolean(conversation.collectedState?.trim());
  const hasZip = Boolean(conversation.collectedZip?.trim());

  if (!hasStreet && !hasCity && !hasZip) {
    gaps.push('address');
  } else {
    if (!hasStreet || !hasCity || !hasState) {
      gaps.push('city_state');
    }
    if (!hasZip) {
      gaps.push('zip');
    }
  }
  if (!conversation.collectedName?.trim()) {
    gaps.push('name');
  }
  if (!conversation.collectedPhone?.trim()) {
    gaps.push('phone');
  }
  return gaps;
}

export function getBookingGapsSummary(
  conversation: InstagramDmConversation | null,
  options: { requireVehicleFields: boolean }
): string {
  if (!conversation) {
    return 'New conversation — like a receptionist. For broad pricing/menu, share link once, then invite them to tell you what they need in chat.';
  }

  if (conversation.bookingId) {
    return 'Booking already created — help with changes or say they can message "new appointment" to start over.';
  }

  if (isFinalRecapSent(conversation.collectedNotes)) {
    return 'Order recap sent — wait for yes / sounds good, then the system books it. Do not re-read the whole order unless they ask.';
  }

  if (
    isReadyToCreateBooking(conversation, options) &&
    !isFinalRecapSent(conversation.collectedNotes)
  ) {
    return 'Everything is collected — server sends one final read-back; do not book yet.';
  }

  if (hasCompleteSchedule(conversation, options)) {
    const customerGaps = getCustomerGaps(conversation);
    if (customerGaps.length === 0) {
      return 'All set — server will send final read-back.';
    }
    if (!isDetailsAskSent(conversation.collectedNotes)) {
      return 'Schedule is set — server will ask for address + name + phone in one casual sentence; do not ask separately like a form.';
    }
    return `Extract address, name, and phone from their message if present. Still missing: ${customerGaps.join(', ')}. Reply in ONE short conversational sentence — like a receptionist, not a form field list.`;
  }

  const scheduleGap = getScheduleGap(conversation, options);
  if (scheduleGap === 'service') {
    return 'Learn what service they want — conversational, not a menu interrogation.';
  }
  if (scheduleGap === 'vehicle') {
    return options.requireVehicleFields
      ? 'Get vehicle year/make/model in natural language (one question, e.g. "what vehicle are we detailing?").'
      : 'Get their vehicle in natural language — one casual question.';
  }
  if (scheduleGap === 'when') {
    return 'Ask when works — you can ask day and time together in one sentence (e.g. "what day and time works for you?").';
  }

  return 'Talk like a receptionist taking an order — short, warm, one thought per message when possible.';
}
