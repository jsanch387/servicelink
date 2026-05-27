/**
 * Extract customer text DMs from Meta `object: instagram` webhook payloads.
 * Skips echoes (messages sent by your business) to avoid reply loops.
 */

export type InstagramTextDmEvent = {
  /** Instagram professional account id (`entry[0].id` in the webhook). */
  instagramAccountId: string;
  senderId: string;
  messageText: string;
};

export type ParseInstagramMessagingResult =
  | { kind: 'customer_dm'; event: InstagramTextDmEvent }
  | { kind: 'skip'; reason: string }
  | { kind: 'not_text_dm' };

export function parseInstagramMessagingWebhook(
  body: unknown
): ParseInstagramMessagingResult {
  if (
    typeof body !== 'object' ||
    body === null ||
    (body as { object?: string }).object !== 'instagram'
  ) {
    return { kind: 'not_text_dm' };
  }

  const entry = (body as { entry?: { id?: string; messaging?: unknown[] }[] })
    .entry?.[0];
  const messagingEvent = entry?.messaging?.[0];

  if (!messagingEvent || typeof messagingEvent !== 'object') {
    return { kind: 'not_text_dm' };
  }

  const event = messagingEvent as {
    sender?: { id?: string };
    message?: { text?: string; is_echo?: boolean };
  };

  if (event.message?.is_echo === true) {
    return {
      kind: 'skip',
      reason: 'echo (message sent by your Instagram account)',
    };
  }

  const senderId = event.sender?.id?.trim();
  const businessAccountId = entry?.id?.trim();

  if (senderId && businessAccountId && senderId === businessAccountId) {
    return {
      kind: 'skip',
      reason: 'sender is business Instagram account (outbound echo)',
    };
  }

  const messageText = event.message?.text?.trim();

  if (senderId && messageText && businessAccountId) {
    return {
      kind: 'customer_dm',
      event: {
        instagramAccountId: businessAccountId,
        senderId,
        messageText,
      },
    };
  }

  return { kind: 'not_text_dm' };
}
