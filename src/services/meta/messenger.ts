/**
 * Send outbound Instagram DMs via Meta Graph API (Messenger Platform + Page token).
 *
 * Use a **Page access token** from the Facebook Page linked to your Instagram
 * professional account (`instagram_manage_messages`). Instagram User tokens
 * use graph.instagram.com instead — see Meta docs if you switch token types.
 */

const GRAPH_API_VERSION = 'v21.0';
const MESSAGES_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`;

export type SendInstagramDMResult = {
  ok: true;
  recipientId: string;
  metaResponse: unknown;
};

/**
 * Normalizes `META_PAGE_ACCESS_TOKEN` from env (trim, strip accidental quotes/Bearer).
 */
export function getMetaPageAccessToken(): string {
  let token = process.env.META_PAGE_ACCESS_TOKEN?.trim() ?? '';
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  if (!token) {
    throw new Error('META_PAGE_ACCESS_TOKEN is not set');
  }
  return token;
}

export type SendInstagramDMOptions = {
  /** Per-business Page token from `instagram_messaging_channels`; falls back to env. */
  pageAccessToken?: string | null;
};

/**
 * Sends a text DM to an Instagram-scoped user id (IGSID from webhook `sender.id`).
 */
export async function sendInstagramDM(
  recipientId: string,
  text: string,
  options?: SendInstagramDMOptions
): Promise<SendInstagramDMResult> {
  const accessToken =
    options?.pageAccessToken?.trim() || getMetaPageAccessToken();

  const trimmedRecipient = recipientId.trim();
  const trimmedText = text.trim();
  if (!trimmedRecipient) {
    throw new Error('recipientId is required');
  }
  if (!trimmedText) {
    throw new Error('message text is required');
  }

  const url = `${MESSAGES_URL}?access_token=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'instagram',
      recipient: { id: trimmedRecipient },
      message: { text: trimmedText },
    }),
  });

  const metaResponse: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Meta send message failed (${response.status}): ${JSON.stringify(metaResponse)}`
    );
  }

  return {
    ok: true,
    recipientId: trimmedRecipient,
    metaResponse,
  };
}
