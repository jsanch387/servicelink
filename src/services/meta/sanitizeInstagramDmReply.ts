/**
 * Post-process AI replies: one clean link intro, no online-booking detours in agent flow.
 */

const BROKEN_LINK_PLACEHOLDER_PATTERN =
  /\b(?:here|at)\s*:\s*\.?\s*|\b(?:book|browse|check out)[^.!?\n]*(?:here|at)\s*:\s*\.?\s*/gi;

const PARTIAL_LINK_SENTENCE_PATTERN =
  /\b(?:you can )?(?:check out|browse|see) (?:our )?(?:full )?(?:menu|pricing|booking options)[^.!?\n]*[.!?]?\s*/gi;

const ONLINE_BOOKING_ALTERNATIVE_PATTERN =
  /\s*(?:you can also|or you can|if you prefer[,]?\s*)[^.!?]*(?:book(?:ing)?\s+(?:directly\s+)?online|booking link|our (?:booking )?link|on(?:line| our website)|browse and book)[^.!?]*[.!?]?/gi;

const TRAILING_BOOKING_LINK_PHRASE_PATTERN =
  /\s*(?:at our booking link|on our booking link|via our booking link)\s*[.!?]?/gi;

/** Model sometimes outputs "here: ." when instructed not to paste the URL. */
export function stripBrokenLinkPlaceholders(replyText: string): string {
  return replyText
    .replace(BROKEN_LINK_PLACEHOLDER_PATTERN, ' ')
    .replace(PARTIAL_LINK_SENTENCE_PATTERN, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Drop leading Hi/Hey when we're already mid-thread. */
export function stripMidConversationGreeting(replyText: string): string {
  return replyText
    .replace(/^(hi|hey|hello)[!,.\s]+/i, '')
    .replace(/^(thanks for reaching out|thanks for messaging)[!.]?\s*/i, '')
    .trim();
}

/** Remove "book online / booking link" escape hatches once we're booking in chat. */
export function stripOnlineBookingAlternatives(replyText: string): string {
  return replyText
    .replace(ONLINE_BOOKING_ALTERNATIVE_PATTERN, '')
    .replace(TRAILING_BOOKING_LINK_PHRASE_PATTERN, '')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!?])\s*([.!?])+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
