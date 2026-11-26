/**
 * Top-level path segments businesses cannot claim as booking slugs.
 * Keep in sync with marketing/app routes and common words crawlers request
 * (`/faq`, `/blog`, `/llms.txt`, …) so those URLs never become profiles.
 *
 * Existing profiles that already use one of these slugs still resolve — this
 * list only blocks new claims. Dedicated App Router pages (e.g. `/faq`) take
 * precedence over `[business-slug]` regardless.
 */
export const RESERVED_BUSINESS_SLUGS = [
  // App + marketing routes
  'admin',
  'affiliates',
  'api',
  'app',
  'auth',
  'auto-detailing',
  'b',
  'billing',
  'book',
  'booking',
  'bookings',
  'business',
  'contact',
  'dashboard',
  'docs',
  'faq',
  'features',
  'find-detailers',
  'get-app',
  'i',
  'invoices',
  'llms',
  'llms.txt',
  'llmstxt',
  'login',
  'maintenance',
  'p',
  'pay',
  'pricing',
  'privacy',
  'q',
  'quotes',
  'r',
  'resources',
  'review',
  'reviews',
  'settings',
  'signup',
  'sitemap',
  'subscribe',
  'team',
  'terms',
  'workshop',
  // Common words / future industry landings
  'about',
  'account',
  'blog',
  'careers',
  'ftp',
  'help',
  'home',
  'index',
  'jobs',
  'legal',
  'mail',
  'manifest',
  'marketplace',
  'news',
  'press',
  'pressure-washing',
  'profile',
  'prolink-services',
  'admin-link',
  'robots',
  'shop',
  'status',
  'store',
  'support',
  'waitlist',
  'www',
  '__not-found',
] as const;

const RESERVED_SLUG_SET = new Set<string>(RESERVED_BUSINESS_SLUGS);

/**
 * First path segments that already have an App Router page/route.
 * Reserved words not in this set (blog, help, …) must 404 instead of
 * falling through to `[business-slug]`.
 */
const IMPLEMENTED_TOP_LEVEL_SEGMENTS = new Set([
  'affiliates',
  'api',
  'auth',
  'auto-detailing',
  'b',
  'contact',
  'dashboard',
  'faq',
  'features',
  'find-detailers',
  'get-app',
  'i',
  'llms.txt',
  'login',
  'maintenance',
  'mobile-bridge',
  'p',
  'pay',
  'pricing',
  'privacy',
  'q',
  'r',
  'resources',
  'review',
  'robots.txt',
  'signup',
  'sitemap.xml',
  'team',
  'terms',
  'workshop',
  '__not-found',
]);

/** `/blog`, `/help`, and other reserved words with no marketing page. */
export function isReservedOrphanTopLevelPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  const segment = parts[0].toLowerCase();
  if (IMPLEMENTED_TOP_LEVEL_SEGMENTS.has(segment)) return false;
  return isReservedBusinessSlug(segment);
}

/** True when this path segment is reserved (case-insensitive, trimmed). */
export function isReservedBusinessSlug(slug: string): boolean {
  const raw = slug.trim().toLowerCase();
  if (!raw) return false;
  if (RESERVED_SLUG_SET.has(raw)) return true;
  const withoutDot = raw.replace(/\./g, '');
  return withoutDot !== raw && RESERVED_SLUG_SET.has(withoutDot);
}
