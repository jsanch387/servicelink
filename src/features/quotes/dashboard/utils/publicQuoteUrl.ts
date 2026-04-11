export function getPublicQuotePath(token: string): string {
  const t = token.trim();
  if (!t) return '/q';
  return `/q/${encodeURIComponent(t)}`;
}

export function getPublicQuoteAbsoluteUrl(token: string): string {
  if (typeof window === 'undefined') return getPublicQuotePath(token);
  return `${window.location.origin}${getPublicQuotePath(token)}`;
}
