export const ROUTES = {
  // Public routes (smooth scroll sections)
  HOME: '#home',
  FEATURES: '#features',
  PRICING: '#pricing',
  ABOUT: '#about',
  CONTACT: '#contact',

  // Legal routes
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Pricing (dedicated page)
  PRICING_PAGE: '/pricing',

  // Public content (guides, blogs, SEO)
  RESOURCES: '/resources',
  /** Path for a single guide; use getResourceGuidePath(slug) for links. */
  RESOURCE_GUIDE: (slug: string) => `/resources/${slug}`,

  // Authentication routes
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Business profile routes
  BUSINESS: {
    PROFILE: '/business/:id',
    CREATE: '/business/create',
    EDIT: '/business/:id/edit',
    DASHBOARD: '/business/dashboard',
    BOOK: '/:slug/book',
    BOOK_SERVICE_DETAILS: '/:slug/book/details',
  },

  // Dashboard routes
  DASHBOARD: {
    MAIN: '/dashboard',
    BUSINESS_PROFILE: '/dashboard/business-profile',
    SERVICES: '/dashboard/services',
    SERVICE_EDIT: '/dashboard/services/:serviceId',
    BOOKINGS: '/dashboard/bookings',
    QUOTES: '/dashboard/quotes',
    /** Pending customer quote requests (not full quotes until you create one). */
    QUOTES_REQUESTS: '/dashboard/quotes/requests',
    /** Single open request (same row as quotes DB; `customer_requested` + `requested`). */
    QUOTE_REQUEST_DETAIL: (requestId: string) =>
      `/dashboard/quotes/requests/${encodeURIComponent(requestId.trim())}`,
    QUOTES_NEW: '/dashboard/quotes/new',
    /** Single quote (owner dashboard). Pass UUID from your data layer. */
    QUOTE_DETAIL: (quoteId: string) =>
      `/dashboard/quotes/${encodeURIComponent(quoteId.trim())}`,
    QUOTE_EDIT: (quoteId: string) =>
      `/dashboard/quotes/${encodeURIComponent(quoteId.trim())}/edit`,
    AVAILABILITY: '/dashboard/availability',
    CUSTOMERS: '/dashboard/customers',
    PAYMENTS: '/dashboard/payments',
    PAYMENTS_TRANSACTIONS: '/dashboard/payments/transactions',
    SETTINGS: '/dashboard/settings',
    UPGRADE: '/dashboard/upgrade',
  },
} as const;

/**
 * Path prefixes that require a signed-in session (see `middleware.ts`).
 * - `/dashboard` covers every nested route (e.g. `/dashboard/quotes/requests/...`).
 * - Add another prefix only if you add a new authenticated area **outside** `/dashboard`.
 */
export const AUTH_REQUIRED_PATH_PREFIXES = ['/dashboard'] as const;

export const API_ROUTES = {
  /** Pro: one-time URL to the connected account’s Stripe Express Dashboard. */
  STRIPE_CONNECT_EXPRESS_DASHBOARD: '/api/stripe/connect/express-dashboard',
  /** Pro + Stripe connected: create/update `payment_settings` and turn on ServiceLink payments. */
  PAYMENTS_SERVICELINK_ENABLE: '/api/payments/servicelink/enable',
  /** Pro: PATCH checkout/deposits / turn ServiceLink payments off. */
  PAYMENTS_SERVICELINK_SETTINGS: '/api/payments/servicelink/settings',
  CUSTOMERS: '/api/customers',
  /** Owner: toggle `accept_quote_req` on current business. */
  BUSINESS_PROFILE_ACCEPT_QUOTE_REQUESTS:
    '/api/business-profile/accept-quote-requests',
  /** Public: customer submits “request quote” from profile. */
  PUBLIC_QUOTE_REQUEST: '/api/public/quote-request',
  /** Public: start Stripe Checkout for a booking payment (deposit or full). */
  PUBLIC_BOOKING_CHECKOUT: '/api/public/booking-checkout',
  /** Public: fetch booking payment summary after successful checkout return. */
  PUBLIC_BOOKING_CHECKOUT_SUMMARY: '/api/public/booking-checkout-summary',
  /** Public: subscribed ICS feed for a business (path includes signed token). */
  CALENDAR_FEED: (token: string) => `/api/calendar/feed/${token}`,
  /** Owner session: JSON with `httpsUrl` + `webcalUrl` for the ICS feed. */
  CALENDAR_FEED_LINK: '/api/calendar/feed/link',
  /** Owner: send an existing `requested` or `draft` quote (e.g. from customer request). */
  QUOTE_SEND_EXISTING: (quoteId: string) =>
    `/api/quotes/${encodeURIComponent(quoteId.trim())}/send`,
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.FEATURES,
  ROUTES.PRICING,
  ROUTES.ABOUT,
  ROUTES.CONTACT,
] as const;

export const AUTH_ROUTES = Object.values(ROUTES.AUTH) as readonly string[];
export const DASHBOARD_ROUTES = Object.values(
  ROUTES.DASHBOARD
) as readonly string[];

/** Query flag: business owner booking on a customer's behalf (dashboard → book flow). */
export const OWNER_MANUAL_BOOKING_FOR = 'owner' as const;

/** Public booking flow (V1 request or V2 availability), same path customers use. */
export function getBusinessBookPath(
  businessSlug: string,
  options?: { forOwner?: boolean }
): string {
  const s = businessSlug.trim();
  if (!s) return ROUTES.DASHBOARD.BOOKINGS;
  const base = `/${encodeURIComponent(s)}/book`;
  if (options?.forOwner) {
    return `${base}?for=${OWNER_MANUAL_BOOKING_FOR}`;
  }
  return base;
}

/**
 * Service + optional add-ons step before the availability calendar.
 * Use `getBusinessBookDetailsUrl` when add-on IDs must be preserved (e.g. back navigation).
 */
export function getBusinessBookDetailsPath(
  businessSlug: string,
  serviceId: string,
  options?: { forOwner?: boolean }
): string {
  return getBusinessBookDetailsUrl(businessSlug, {
    serviceId,
    forOwner: options?.forOwner,
  });
}

export type BookDetailsStepQuery = 'price' | 'addons';

export function getBusinessBookDetailsUrl(
  businessSlug: string,
  params: {
    serviceId: string;
    addOnIds?: string;
    /** Restores chosen multi-price option when linking back from the calendar step. */
    priceOptionId?: string;
    /** Which details sub-step to open (`price` = choose option, `addons` = add-ons). */
    detailsStep?: BookDetailsStepQuery;
    forOwner?: boolean;
  }
): string {
  const slug = businessSlug.trim();
  const sid = params.serviceId.trim();
  if (!slug || !sid) return ROUTES.DASHBOARD.BOOKINGS;
  const q = new URLSearchParams({ serviceId: sid });
  if (params.addOnIds?.trim()) {
    q.set('addOnIds', params.addOnIds.trim());
  }
  if (params.priceOptionId?.trim()) {
    q.set('priceOptionId', params.priceOptionId.trim());
  }
  if (params.detailsStep === 'addons' || params.detailsStep === 'price') {
    q.set('detailsStep', params.detailsStep);
  }
  if (params.forOwner) {
    q.set('for', OWNER_MANUAL_BOOKING_FOR);
  }
  return `/${encodeURIComponent(slug)}/book/details?${q.toString()}`;
}
