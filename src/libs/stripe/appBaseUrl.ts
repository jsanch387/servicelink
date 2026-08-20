/**
 * Public origin for Stripe redirect URLs (Checkout success/cancel, Connect
 * return/refresh) and customer email links.
 *
 * Request host wins for localhost / custom domains. Preview `*.vercel.app`
 * hosts are skipped when a canonical site URL is set — otherwise customers
 * leave Stripe onto an auth-walled Vercel URL.
 */
const CANONICAL_PRODUCTION_ORIGIN = 'https://myservicelink.app';

function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function canonicalSiteOrigin(): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value || value === 'undefined') continue;
    const origin = normalizeOrigin(value);
    if (origin) return origin;
  }
  return '';
}

function firstHeaderValue(
  request: Request | null | undefined,
  name: string
): string | null {
  const raw = request?.headers.get(name);
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  return first || null;
}

function isVercelPreviewHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  return hostname.endsWith('.vercel.app');
}

export function getAppBaseUrl(request?: Request | null): string {
  const canonical = canonicalSiteOrigin();
  const host =
    firstHeaderValue(request, 'x-forwarded-host') ||
    firstHeaderValue(request, 'host');

  if (host && !isVercelPreviewHost(host)) {
    const proto =
      firstHeaderValue(request, 'x-forwarded-proto') ||
      (process.env.NODE_ENV === 'development' ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  if (canonical) return canonical;

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return CANONICAL_PRODUCTION_ORIGIN;
}
