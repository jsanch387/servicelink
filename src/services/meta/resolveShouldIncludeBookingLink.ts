import type { ConversationIntent } from '@/services/ai/intentParser';
import { messageLikelyNeedsBookingLink } from '@/services/meta/ensureBookingLinkInReply';
import type { InstagramDmConversation } from '@/services/meta/instagramDmConversation';

const EXPLICIT_LINK_REQUEST_PATTERN =
  /\b(send (me )?(the )?link|booking link|your link|website|url|where (do i|can i) book|book online)\b/i;

export function userExplicitlyRequestsBookingLink(
  messageText: string
): boolean {
  return EXPLICIT_LINK_REQUEST_PATTERN.test(messageText.trim());
}

function isInAgentFlow(existing: InstagramDmConversation | null): boolean {
  if (!existing) {
    return false;
  }

  if (
    existing.collectedService ||
    existing.collectedVehicle ||
    existing.collectedDate
  ) {
    return true;
  }

  return (
    existing.stage === 'qualifying' ||
    existing.stage === 'offering' ||
    existing.stage === 'ready_to_book'
  );
}

function customerMessageStartsSpecificBooking(
  parsed: Pick<
    ConversationIntent,
    'packageName' | 'extractedVehicle' | 'requestedDate'
  >
): boolean {
  return Boolean(
    parsed.packageName?.trim() ||
      parsed.extractedVehicle?.trim() ||
      parsed.requestedDate?.trim()
  );
}

export function outboundAlreadyContainedBookingLink(
  lastOutboundText: string | null | undefined,
  bookingLink: string | null | undefined
): boolean {
  if (!lastOutboundText?.trim() || !bookingLink?.trim()) {
    return false;
  }
  return lastOutboundText.includes(bookingLink.trim());
}

/** Link was shared on an earlier turn even if the latest reply only said "booking link". */
export function inferBookingLinkAlreadyShared(
  existing: InstagramDmConversation | null,
  bookingLink: string | null | undefined
): boolean {
  if (!existing) {
    return false;
  }

  if (
    outboundAlreadyContainedBookingLink(existing.lastOutboundText, bookingLink)
  ) {
    return true;
  }

  if (
    existing.collectedService ||
    existing.collectedVehicle ||
    existing.collectedDate
  ) {
    return true;
  }

  return (
    existing.stage !== 'greeting' && Boolean(existing.lastOutboundText?.trim())
  );
}

/**
 * Share booking link once on first broad outreach; then in-chat agent only.
 * Re-send only if the customer explicitly asks for the link.
 */
export function resolveShouldIncludeBookingLink(args: {
  bookingLink: string | null;
  existing: InstagramDmConversation | null;
  lastOutboundText: string | null;
  messageText: string;
  parsed: Pick<
    ConversationIntent,
    | 'shouldIncludeBookingLink'
    | 'packageName'
    | 'extractedVehicle'
    | 'requestedDate'
  >;
}): boolean {
  const { bookingLink, existing, lastOutboundText, messageText, parsed } = args;
  if (!bookingLink?.trim()) {
    return false;
  }

  if (userExplicitlyRequestsBookingLink(messageText)) {
    return true;
  }

  if (
    outboundAlreadyContainedBookingLink(lastOutboundText, bookingLink) ||
    inferBookingLinkAlreadyShared(existing, bookingLink)
  ) {
    return false;
  }

  const isFirstTurn = !existing;
  const specificBookingThisTurn = customerMessageStartsSpecificBooking(parsed);

  if (isFirstTurn) {
    if (specificBookingThisTurn) {
      return false;
    }
    return (
      parsed.shouldIncludeBookingLink ||
      messageLikelyNeedsBookingLink(messageText)
    );
  }

  if (specificBookingThisTurn || isInAgentFlow(existing)) {
    return false;
  }

  return false;
}

export function stripBookingLinkFromReply(
  replyText: string,
  bookingLink: string | null | undefined
): string {
  const link = bookingLink?.trim();
  if (!link || !replyText.includes(link)) {
    return replyText.trim();
  }

  return replyText
    .replaceAll(link, '')
    .replace(/\s+at\s*[.,]/g, '.')
    .replace(/\s*book( directly)?\s*(online)?\s*at\s*[.,]?/gi, ' ')
    .replace(
      /\s*see all (our )?pricing and book\s*(online)?\s*at\s*[.,]?/gi,
      ' '
    )
    .replace(/\s*you can see[^.]*at\s*[.,]?/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
