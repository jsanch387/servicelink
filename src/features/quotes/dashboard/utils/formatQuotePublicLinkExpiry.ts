import { QUOTE_PUBLIC_LINK_TTL_DAYS } from '@/features/quotes/shared/quotePublicLinkTtl';

export function formatQuotePublicLinkExpiryDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function quotePublicLinkExpiryCopy(expiresAtIso: string): string {
  const when = formatQuotePublicLinkExpiryDate(expiresAtIso);
  if (!when) {
    return `This link expires ${QUOTE_PUBLIC_LINK_TTL_DAYS} days after you send it.`;
  }
  return `This link expires ${when} (${QUOTE_PUBLIC_LINK_TTL_DAYS} days after you send).`;
}

/** Customer-facing line on `/q/` and the quote email. */
export function quotePublicLinkValidUntilCopy(expiresAtIso: string): string {
  const when = formatQuotePublicLinkExpiryDate(expiresAtIso);
  if (!when)
    return `This quote is valid for ${QUOTE_PUBLIC_LINK_TTL_DAYS} days.`;
  return `Valid until ${when}.`;
}
