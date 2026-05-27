import { normalizeBookingLink } from '@/services/meta/normalizeBookingLink';
import { stripBrokenLinkPlaceholders } from '@/services/meta/sanitizeInstagramDmReply';

const LINK_WORTHY_PATTERN =
  /\b(price|pricing|prices|cost|how much|menu|packages?|book|booking|schedule|appointment|availability|available|pay|payment|card|deposit|checkout|link|website|url)\b/i;

export function messageLikelyNeedsBookingLink(messageText: string): boolean {
  return LINK_WORTHY_PATTERN.test(messageText.trim());
}

const IN_CHAT_HELP_OFFER_PATTERN =
  /\b(let me know|tell me what|i can help|help you|get you scheduled|here in the chat|right here|happy to help you pick)\b/i;

function bookingCtaSuffix(
  bookingLink: string,
  acceptBookings: boolean
): string {
  const action = acceptBookings
    ? 'browse our full menu, see pricing, and pick a time'
    : 'see our services and send a booking request';
  return `You can ${action} here: ${bookingLink}. Or just tell me what you need (service, vehicle, preferred day) and I'll help get you scheduled right here in the chat.`;
}

function linkOnlySuffix(bookingLink: string, acceptBookings: boolean): string {
  const action = acceptBookings
    ? 'Browse our full menu and book'
    : 'View our services and request a time';
  return `${action} here: ${bookingLink}`;
}

function inChatHelpOfferSuffix(acceptBookings: boolean): string {
  return acceptBookings
    ? "Or tell me what you're looking for (service, vehicle, preferred day) and I'll help get you scheduled right here in the chat."
    : "Or tell me what you're looking for and I'll help you get a booking request started here in the chat.";
}

/**
 * Appends the canonical https booking link when the reply should include it but does not yet.
 */
export function ensureBookingLinkInReply(
  replyText: string,
  bookingLink: string | null | undefined,
  options: {
    shouldInclude: boolean;
    acceptBookings: boolean;
  }
): string {
  if (!options.shouldInclude || !bookingLink?.trim()) {
    return replyText;
  }

  const link = normalizeBookingLink(bookingLink, null) ?? bookingLink.trim();
  const trimmed = stripBrokenLinkPlaceholders(replyText.trim());
  const hasHelpOffer = IN_CHAT_HELP_OFFER_PATTERN.test(trimmed);

  if (trimmed.includes(link)) {
    if (hasHelpOffer) {
      return trimmed;
    }
    return `${trimmed}\n\n${inChatHelpOfferSuffix(options.acceptBookings)}`;
  }

  if (hasHelpOffer) {
    return `${trimmed}\n\n${linkOnlySuffix(link, options.acceptBookings)}`;
  }

  const suffix = bookingCtaSuffix(link, options.acceptBookings);
  return trimmed ? `${trimmed}\n\n${suffix}` : suffix;
}
