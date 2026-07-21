export const ROUTES = {
  // Public routes (smooth scroll sections)
  HOME: '#home',
  FEATURES: '#features',
  PRICING: '#pricing',
  ABOUT: '#about',
  CONTACT: '#contact',

  // Legal & support routes
  TERMS: '/terms',
  PRIVACY: '/privacy',
  CONTACT_PAGE: '/contact',

  // Marketing pages
  FEATURES_PAGE: '/features',
  PRICING_PAGE: '/pricing',
  FIND_DETAILERS: '/find-detailers',

  // Public content (guides, blogs, SEO)
  RESOURCES: '/resources',
  /** Path for a single guide; use getResourceGuidePath(slug) for links. */
  RESOURCE_GUIDE: (slug: string) => `/resources/${slug}`,

  /** Free ads masterclass — email gate (landing). */
  WORKSHOP: '/workshop',
  /** Gated workshop video. */
  WORKSHOP_WATCH: '/workshop/watch',
  /** @deprecated Use `ROUTES.WORKSHOP` — redirects to `/workshop`. */
  WORKSHOP_RUN_ADS: '/workshop/run-ads',
  /** Signup with workshop funnel attribution (`?from=workshop`). */
  WORKSHOP_SIGNUP: '/signup?from=workshop',

  // Authentication routes
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    /** PKCE `code` exchange (OAuth + password recovery). Use `?next=` for post-auth path. */
    CALLBACK: '/auth/callback',
    /** Shown after email/password sign-up when Supabase requires confirming email (no session yet). */
    CHECK_EMAIL: '/auth/check-email',
    /** After clicking the confirm link (same browser): session is set in callback, then user lands here before dashboard. */
    EMAIL_CONFIRMED: '/auth/email-confirmed',
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
    REVIEWS: '/dashboard/reviews',
    /** Single review (owner dashboard). Pass UUID from your data layer. */
    REVIEW_DETAIL: (reviewId: string) =>
      `/dashboard/reviews/${encodeURIComponent(reviewId.trim())}`,
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
    MARKETING: '/dashboard/marketing',
    MARKETING_PROMO_CODES_NEW: '/dashboard/marketing/promo-codes/new',
    MARKETING_PROMO_CODE_EDIT: (promoCodeId: string) =>
      `/dashboard/marketing/promo-codes/${encodeURIComponent(promoCodeId.trim())}/edit`,
    MARKETING_SALES_NEW: '/dashboard/marketing/sales/new',
    MARKETING_SALE_EDIT: (saleId: string) =>
      `/dashboard/marketing/sales/${encodeURIComponent(saleId.trim())}/edit`,
    SETTINGS: '/dashboard/settings',
    CONTACT: '/dashboard/contact',
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
  /** Pro: Stripe Connect Express onboarding (Account Link); web cookies or Bearer (mobile). */
  STRIPE_CONNECT_ONBOARD: '/api/stripe/connect/onboard',
  /** Pro: refresh `payment_accounts` from Stripe (e.g. after Connect return on mobile). */
  STRIPE_CONNECT_SYNC: '/api/stripe/connect/sync',
  /** Pro: one-time URL to the connected account’s Stripe Express Dashboard. */
  STRIPE_CONNECT_EXPRESS_DASHBOARD: '/api/stripe/connect/express-dashboard',
  /** Onboarding step 5 (web): start Pro trial via Stripe Subscription API (no Checkout redirect). */
  STRIPE_START_ONBOARDING_TRIAL: '/api/stripe/start-onboarding-trial',
  /**
   * Onboarding V2: mark onboarding complete + welcome-live email.
   * Web: cookies. Mobile: `Authorization: Bearer`. See `docs/contracts/mobile-onboarding-complete.md`.
   */
  ONBOARDING_V2_COMPLETE: '/api/onboarding-v2/complete',
  /** Authenticated: Stripe Checkout session URL for Pro (web upgrade / billing). */
  STRIPE_CREATE_CHECKOUT_SESSION: '/api/stripe/create-checkout-session',
  /** Authenticated: Stripe Customer Portal session URL (manage subscription / payment method). */
  STRIPE_CREATE_PORTAL_SESSION: '/api/stripe/create-portal-session',
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
  /** Owner: list quotes or create and send a new quote. */
  QUOTES: '/api/quotes',
  QUOTE_SEND: '/api/quotes/send',
  /** Owner: read, edit, or delete one quote. */
  QUOTE_DETAIL: (quoteId: string) =>
    `/api/quotes/${encodeURIComponent(quoteId.trim())}`,
  /** Public: start Stripe Checkout for a booking payment (deposit or full). */
  PUBLIC_BOOKING_CHECKOUT: '/api/public/booking-checkout',
  /** Public: fetch booking payment summary after successful checkout return. */
  PUBLIC_BOOKING_CHECKOUT_SUMMARY: '/api/public/booking-checkout-summary',
  /** Public: validate a promo code for booking checkout preview. */
  PUBLIC_PROMO_CODE_VALIDATE: '/api/public/promo-codes/validate',
  /** Public: subscribed ICS feed for a business (path includes signed token). */
  CALENDAR_FEED: (token: string) => `/api/calendar/feed/${token}`,
  /** Owner session: JSON with `httpsUrl` + `webcalUrl` for the ICS feed. */
  CALENDAR_FEED_LINK: '/api/calendar/feed/link',
  /** Owner: send an existing `requested` or `draft` quote (e.g. from customer request). */
  QUOTE_SEND_EXISTING: (quoteId: string) =>
    `/api/quotes/${encodeURIComponent(quoteId.trim())}/send`,
  /**
   * Authenticated: permanently delete the current user's account.
   * Method: DELETE. Body: `{ confirmEmail }`. Auth via cookie or
   * `Authorization: Bearer <supabase access token>` (mobile).
   */
  ACCOUNT: '/api/account',
  /** Public contact form (landing /contact page). */
  CONTACT: '/api/contact',
  /** Public: capture email for `/workshop` gate access. */
  WORKSHOP_REGISTER: '/api/workshop/register',
  /** Public: record funnel step for a workshop lead (video view, signup click). */
  WORKSHOP_TRACK: '/api/workshop/track',
  /** Public: mark workshop lead as signed up (matched by email). */
  WORKSHOP_CONVERTED: '/api/workshop/converted',
  /** Authenticated: write-once signup source attribution. */
  MARKETING_ATTRIBUTION_SIGNUP: '/api/attribution/signup',
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

/** Query key for locale across `/[slug]/book` and `/[slug]/book/details` (funnel only). */
export const PUBLIC_BOOKING_FLOW_LANG_QUERY = 'lang' as const;

/** Single source of truth: add a code here, then add catalog + BCP 47 + API overrides. */
export const PUBLIC_BOOKING_FLOW_LOCALES = ['en', 'es'] as const;

export type PublicBookingFlowLocale =
  (typeof PUBLIC_BOOKING_FLOW_LOCALES)[number];

/** Default funnel locale (clean URLs omit `?lang=` for this code). */
export const DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE: PublicBookingFlowLocale =
  PUBLIC_BOOKING_FLOW_LOCALES[0];

/** Short labels for the public profile language toggle (extend when adding locales). */
export const PUBLIC_BOOKING_FLOW_LOCALE_SHORT_LABEL: Record<
  PublicBookingFlowLocale,
  string
> = {
  en: 'EN',
  es: 'ES',
};

export function isPublicBookingFlowLocale(
  value: string | null | undefined
): value is PublicBookingFlowLocale {
  return (
    typeof value === 'string' &&
    (PUBLIC_BOOKING_FLOW_LOCALES as readonly string[]).includes(value)
  );
}

function appendPublicBookingFlowLang(
  q: URLSearchParams,
  lang?: PublicBookingFlowLocale | null
) {
  if (!lang || lang === DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE) return;
  if (!isPublicBookingFlowLocale(lang)) return;
  q.set(PUBLIC_BOOKING_FLOW_LANG_QUERY, lang);
}

/** Owner book picker sub-screen restored via `?entry=` after leaving service details. */
export type OwnerBookEntryQuery = 'services';

/** Public booking flow (V1 request or V2 availability), same path customers use. */
export function getBusinessBookPath(
  businessSlug: string,
  options?: {
    forOwner?: boolean;
    lang?: PublicBookingFlowLocale | null;
    /** Owner-only: open the saved-services list instead of the choice screen. */
    entry?: OwnerBookEntryQuery | null;
  }
): string {
  const s = businessSlug.trim();
  if (!s) return ROUTES.DASHBOARD.BOOKINGS;
  const base = `/${encodeURIComponent(s)}/book`;
  const q = new URLSearchParams();
  if (options?.forOwner) {
    q.set('for', OWNER_MANUAL_BOOKING_FOR);
  }
  if (options?.forOwner && options.entry === 'services') {
    q.set('entry', 'services');
  }
  appendPublicBookingFlowLang(q, options?.lang);
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

export function getBusinessBookCustomScheduleUrl(
  businessSlug: string,
  params: {
    serviceName: string;
    priceCents?: number;
    durationMinutes: number;
    notes?: string;
    forOwner?: boolean;
    lang?: PublicBookingFlowLocale | null;
  }
): string {
  const slug = businessSlug.trim();
  const name = params.serviceName.trim();
  const duration = Math.max(1, Math.round(params.durationMinutes));
  if (!slug || !name || !Number.isFinite(duration)) {
    return ROUTES.DASHBOARD.BOOKINGS;
  }
  const q = new URLSearchParams();
  q.set('customJob', '1');
  q.set('customServiceName', name);
  q.set('customServiceDurationMinutes', String(duration));
  if (params.priceCents != null && Number.isFinite(params.priceCents)) {
    q.set('customServicePriceCents', String(Math.max(0, params.priceCents)));
  }
  if (params.notes?.trim()) {
    q.set('customJobNotes', params.notes.trim());
  }
  if (params.forOwner) {
    q.set('for', OWNER_MANUAL_BOOKING_FOR);
  }
  appendPublicBookingFlowLang(q, params.lang);
  return `/${encodeURIComponent(slug)}/book?${q.toString()}`;
}

/**
 * Service + optional add-ons step before the availability calendar.
 * Use `getBusinessBookDetailsUrl` when add-on IDs must be preserved (e.g. back navigation).
 */
export function getBusinessBookDetailsPath(
  businessSlug: string,
  serviceId: string,
  options?: { forOwner?: boolean; lang?: PublicBookingFlowLocale | null }
): string {
  return getBusinessBookDetailsUrl(businessSlug, {
    serviceId,
    forOwner: options?.forOwner,
    lang: options?.lang,
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
    lang?: PublicBookingFlowLocale | null;
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
  appendPublicBookingFlowLang(q, params.lang);
  return `/${encodeURIComponent(slug)}/book/details?${q.toString()}`;
}

/**
 * Calendar + post-schedule steps live on `/[slug]/book` with query params.
 * Prefer this over string templates so `lang` and other keys stay consistent.
 */
export function getBusinessBookScheduleUrl(
  businessSlug: string,
  params: {
    serviceId: string;
    priceOptionId?: string;
    addOnIds?: string;
    detailsStep?: BookDetailsStepQuery;
    /** When set, calendar opens after skipping configure (server redirect). */
    skipDetails?: boolean;
    forOwner?: boolean;
    checkout?: string;
    session_id?: string;
    lang?: PublicBookingFlowLocale | null;
  }
): string {
  const slug = businessSlug.trim();
  const sid = params.serviceId.trim();
  if (!slug || !sid) return ROUTES.DASHBOARD.BOOKINGS;
  const q = new URLSearchParams();
  q.set('serviceId', sid);
  if (params.priceOptionId?.trim()) {
    q.set('priceOptionId', params.priceOptionId.trim());
  }
  if (params.addOnIds?.trim()) {
    q.set('addOnIds', params.addOnIds.trim());
  }
  if (params.detailsStep === 'addons' || params.detailsStep === 'price') {
    q.set('detailsStep', params.detailsStep);
  }
  if (params.skipDetails) {
    q.set('skipDetails', '1');
  }
  if (params.forOwner) {
    q.set('for', OWNER_MANUAL_BOOKING_FOR);
  }
  if (params.checkout?.trim()) {
    q.set('checkout', params.checkout.trim());
  }
  if (params.session_id?.trim()) {
    q.set('session_id', params.session_id.trim());
  }
  appendPublicBookingFlowLang(q, params.lang);
  return `/${encodeURIComponent(slug)}/book?${q.toString()}`;
}

/**
 * Public marketing profile `/{slug}` — adds `?lang=` for non-default funnel locales.
 */
export function getPublicBusinessProfilePath(
  businessSlug: string,
  options?: { lang?: PublicBookingFlowLocale | null }
): string {
  const s = businessSlug.trim();
  if (!s) return '/';
  const base = `/${encodeURIComponent(s)}`;
  const lang = options?.lang;
  if (!lang || lang === DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE) return base;
  return `${base}?${PUBLIC_BOOKING_FLOW_LANG_QUERY}=${lang}`;
}

/** Public “request quote” wizard `/{slug}/quote` — adds `?lang=` for non-default locales. */
export function getPublicQuoteRequestPath(
  businessSlug: string,
  options?: { lang?: PublicBookingFlowLocale | null }
): string {
  const s = businessSlug.trim();
  if (!s) return '/';
  const base = `/${encodeURIComponent(s)}/quote`;
  const lang = options?.lang;
  if (!lang || lang === DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE) return base;
  return `${base}?${PUBLIC_BOOKING_FLOW_LANG_QUERY}=${lang}`;
}

/**
 * Customer-facing maintenance enrollment review link (raw URL-safe token in path).
 * Server resolves `customer_link_token_hash` = SHA-256 hex of the raw token.
 */
export function getPublicMaintenanceEnrollmentPath(token: string): string {
  const t = token.trim();
  if (!t) return '/maintenance/e';
  return `/maintenance/e/${encodeURIComponent(t)}`;
}

/**
 * Customer-facing review form (raw URL-safe token in path).
 * Server resolves `review_invites.link_token_hash` = SHA-256 hex of the raw token.
 */
export function getPublicReviewPath(token: string): string {
  const t = token.trim();
  if (!t) return '/review';
  return `/review/${encodeURIComponent(t)}`;
}

/** Customer-facing booking invoice / receipt page (opaque public_token in path). */
export function getPublicInvoicePath(publicToken: string): string {
  const t = publicToken.trim();
  if (!t) return '/i';
  return `/i/${encodeURIComponent(t)}`;
}
