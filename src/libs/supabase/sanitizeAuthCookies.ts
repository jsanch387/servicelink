/**
 * @supabase/ssr 0.7 throws during session init when chunked auth cookies are
 * mixed (legacy `base64-` + raw JWT JSON) or otherwise undecodable.
 * Treat those cookies as missing and expire them so one bad session cannot
 * 500 APIs / spam logs on every request.
 */

export type CookiePair = { name: string; value: string };

const AUTH_TOKEN_COOKIE = /^(sb-[^.]+-auth-token)(?:\.(\d+))?$/;
const BASE64_PREFIX = 'base64-';

export function sanitizeSupabaseAuthCookies(cookies: CookiePair[]): {
  cookies: CookiePair[];
  staleNames: string[];
} {
  const families = new Map<string, CookiePair[]>();
  const others: CookiePair[] = [];

  for (const cookie of cookies) {
    const match = cookie.name.match(AUTH_TOKEN_COOKIE);
    if (!match) {
      others.push(cookie);
      continue;
    }
    const key = match[1];
    const list = families.get(key) ?? [];
    list.push(cookie);
    families.set(key, list);
  }

  const staleNames: string[] = [];
  const keptAuth: CookiePair[] = [];

  for (const [key, family] of families) {
    const combined = combineAuthCookieFamily(key, family);
    if (combined && !isSafeSessionCookieValue(combined)) {
      staleNames.push(...family.map(cookie => cookie.name));
      continue;
    }
    keptAuth.push(...family);
  }

  return { cookies: [...others, ...keptAuth], staleNames };
}

export function expireCookieOptions(): {
  path: '/';
  maxAge: 0;
  sameSite: 'lax';
} {
  return { path: '/', maxAge: 0, sameSite: 'lax' };
}

function combineAuthCookieFamily(
  key: string,
  family: CookiePair[]
): string | null {
  const byName = new Map(family.map(cookie => [cookie.name, cookie.value]));
  const unchunked = byName.get(key);
  if (unchunked) return unchunked;

  const parts: string[] = [];
  for (let i = 0; ; i += 1) {
    const part = byName.get(`${key}.${i}`);
    if (!part) break;
    parts.push(part);
  }
  return parts.length > 0 ? parts.join('') : null;
}

function isSafeSessionCookieValue(value: string): boolean {
  let decoded = value;
  if (value.startsWith(BASE64_PREFIX)) {
    try {
      decoded = decodeBase64Url(value.slice(BASE64_PREFIX.length));
    } catch {
      return false;
    }
  }

  try {
    const parsed = JSON.parse(decoded) as unknown;
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

function decodeBase64Url(input: string): string {
  const stripped = input.replace(/[ \t\n\r=]/g, '');
  if (/[^A-Za-z0-9_-]/.test(stripped)) {
    throw new Error('Invalid Base64-URL character');
  }
  const pad =
    stripped.length % 4 === 0 ? '' : '='.repeat(4 - (stripped.length % 4));
  const padded = stripped + pad;
  const standard = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(standard, 'base64').toString('utf8');
}
