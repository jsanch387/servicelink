/** How long a sent quote’s public `/q/` link stays valid. */
export const QUOTE_PUBLIC_LINK_TTL_DAYS = 14;

export function quotePublicLinkExpiresAt(nowMs: number = Date.now()): string {
  return new Date(
    nowMs + QUOTE_PUBLIC_LINK_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}
