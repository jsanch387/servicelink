import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';

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
  /** City SEO page; use getFindDetailersCityPath(slug). */
  FIND_DETAILERS_CITY: (citySlug: string) =>
    `/find-detailers/${encodeURIComponent(citySlug.trim().toLowerCase())}`,

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
    /** Owner: customer subscription plans offered on the booking link. */
    SUBSCRIPTIONS: '/dashboard/subscriptions',
    /** Owner: create a subscription plan (wizard). */
    SUBSCRIPTIONS_NEW: '/dashboard/subscriptions/new',
    /** Owner: single subscription plan detail. */
    SUBSCRIPTIONS_DETAIL: (planId: string) =>
      `/dashboard/subscriptions/${encodeURIComponent(planId.trim())}`,
    /** Owner: edit a subscription plan (same wizard as create). */
    SUBSCRIPTIONS_EDIT: (planId: string) =>
      `/dashboard/subscriptions/${encodeURIComponent(planId.trim())}/edit`,
    /** Owner: single subscriber detail / support actions. */
    SUBSCRIPTIONS_SUBSCRIBER: (subscriberId: string) =>
      `/dashboard/subscriptions/subscribers/${encodeURIComponent(subscriberId.trim())}`,
    BOOKINGS: '/dashboard/bookings',
    /** Owner multi-job create appointment wizard. */
    BOOKINGS_NEW: '/dashboard/bookings/new',
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
  /** Public: find marketplace businesses by city/state or ZIP. */
  MARKETPLACE_SEARCH: '/api/public/marketplace/search',
  /** Pro: Stripe Connect Express onboarding (Account Link); web cookies or Bearer (mobile). */
  STRIPE_CONNECT_ONBOARD: '/api/stripe/connect/onboard',
  /** Pro: refresh `payment_accounts` from Stripe (e.g. after Connect return on mobile). */
  STRIPE_CONNECT_SYNC: '/api/stripe/connect/sync',
  /** Pro: one-time URL to the connected account’s Stripe Express Dashboard. */
  STRIPE_CONNECT_EXPRESS_DASHBOARD: '/api/stripe/connect/express-dashboard',
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
  /** Owner: memberships state (plans). */
  MEMBERSHIPS: '/api/memberships',
  /** Owner: create a membership plan. */
  MEMBERSHIPS_PLANS: '/api/memberships/plans',
  /** Owner: update a membership plan. */
  MEMBERSHIPS_PLAN: (planId: string) =>
    `/api/memberships/plans/${encodeURIComponent(planId.trim())}`,
  /** Owner: list customer memberships (subscribers). */
  MEMBERSHIPS_SUBSCRIBERS: '/api/memberships/subscribers',
  /** Owner: one subscriber — get, cancel, portal link. */
  MEMBERSHIPS_SUBSCRIBER: (subscriberId: string) =>
    `/api/memberships/subscribers/${encodeURIComponent(subscriberId.trim())}`,
  /** Public: signed token → Stripe Connect Customer Portal (manage / cancel). */
  PUBLIC_MEMBERSHIPS_PORTAL: '/api/public/memberships/portal',
  /** Public: email a manage/cancel link for an existing membership. */
  PUBLIC_MEMBERSHIPS_MANAGE_LINK: '/api/public/memberships/manage-link',
  /** Owner: toggle `accept_quote_req` on current business. */
  BUSINESS_PROFILE_ACCEPT_QUOTE_REQUESTS:
    '/api/business-profile/accept-quote-requests',
  /** Owner: upsert primary mobile service area (city + radius). */
  BUSINESS_PROFILE_SERVICE_AREA: '/api/business-profile/service-area',
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
  /** Public: start Stripe Checkout (subscription) for a membership plan price. */
  PUBLIC_MEMBERSHIPS_CHECKOUT: '/api/public/memberships/checkout',
  /** Public: CRM address/vehicle lookup for membership subscribe / visit. */
  PUBLIC_MEMBERSHIPS_CUSTOMER_SNAPSHOT:
    '/api/public/memberships/customer-snapshot',
  /** Public: member books next period visit with signed token. */
  PUBLIC_MEMBERSHIPS_VISIT: '/api/public/memberships/visit',
  /** Public: fetch booking payment summary after successful checkout return. */
  PUBLIC_BOOKING_CHECKOUT_SUMMARY: '/api/public/booking-checkout-summary',
  /** Public: returning-customer saved vehicles/pets for the book flow. */
  PUBLIC_CUSTOMER_ASSETS: '/api/public/customer-assets',
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

/**
 * Query key that tags which channel sent a visitor to a public profile
 * (`?ref=marketplace`). Middleware converts it to a cookie and strips it from
 * the URL; see `features/booking-attribution`.
 */
export const BOOKING_REFERRAL_QUERY = 'ref' as const;

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
    /**
     * Public multi-job: customer is adding another service to the current visit.
     * Without this, a fresh book start clears the visit cart.
     */
    addJob?: boolean;
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
  if (options?.addJob) {
    q.set('addJob', '1');
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
  options?: {
    forOwner?: boolean;
    lang?: PublicBookingFlowLocale | null;
    /** Append to current public multi-job visit cart. */
    addJob?: boolean;
    /** Replace the sole visit job and keep contact/schedule draft. */
    editVisit?: boolean;
  }
): string {
  return getBusinessBookDetailsUrl(businessSlug, {
    serviceId,
    forOwner: options?.forOwner,
    lang: options?.lang,
    addJob: options?.addJob,
    editVisit: options?.editVisit,
  });
}

export type BookDetailsStepQuery = 'price' | 'addons' | 'location';

export type BookServiceLocationTypeQuery = 'mobile' | 'shop';

export function parseBookServiceLocationTypeQuery(
  value: string | null | undefined
): BookServiceLocationTypeQuery | undefined {
  return value === 'mobile' || value === 'shop' ? value : undefined;
}

export function getBusinessBookDetailsUrl(
  businessSlug: string,
  params: {
    serviceId: string;
    addOnIds?: string;
    /** Restores chosen multi-price option when linking back from the calendar step. */
    priceOptionId?: string;
    /** Which details sub-step to open (`price` | `addons` | `location`). */
    detailsStep?: BookDetailsStepQuery;
    /** Mobile vs shop when business offers both (restored on back navigation). */
    serviceLocationType?: BookServiceLocationTypeQuery;
    forOwner?: boolean;
    lang?: PublicBookingFlowLocale | null;
    /** Append to current public multi-job visit cart (do not clear). */
    addJob?: boolean;
    /** Replace the sole visit job and keep contact/schedule draft. */
    editVisit?: boolean;
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
  if (
    params.detailsStep === 'addons' ||
    params.detailsStep === 'price' ||
    params.detailsStep === 'location'
  ) {
    q.set('detailsStep', params.detailsStep);
  }
  if (
    params.serviceLocationType === 'mobile' ||
    params.serviceLocationType === 'shop'
  ) {
    q.set('serviceLocationType', params.serviceLocationType);
  }
  if (params.forOwner) {
    q.set('for', OWNER_MANUAL_BOOKING_FOR);
  }
  if (params.addJob) {
    q.set('addJob', '1');
  }
  if (params.editVisit) {
    q.set('editVisit', '1');
  }
  appendPublicBookingFlowLang(q, params.lang);
  return `/${encodeURIComponent(slug)}/book/details?${q.toString()}`;
}

/**
 * Multi-job public visit calendar (`/book?visit=1`). Jobs live in sessionStorage.
 */
export function getBusinessBookVisitUrl(
  businessSlug: string,
  params?: {
    serviceLocationType?: BookServiceLocationTypeQuery;
    lang?: PublicBookingFlowLocale | null;
    checkout?: string;
    session_id?: string;
  }
): string {
  const slug = businessSlug.trim();
  if (!slug) return ROUTES.DASHBOARD.BOOKINGS;
  const q = new URLSearchParams();
  q.set('visit', '1');
  if (
    params?.serviceLocationType === 'mobile' ||
    params?.serviceLocationType === 'shop'
  ) {
    q.set('serviceLocationType', params.serviceLocationType);
  }
  if (params?.checkout?.trim()) {
    q.set('checkout', params.checkout.trim());
  }
  if (params?.session_id?.trim()) {
    q.set('session_id', params.session_id.trim());
  }
  appendPublicBookingFlowLang(q, params?.lang);
  return `/${encodeURIComponent(slug)}/book?${q.toString()}`;
}

export function getBusinessBookScheduleUrl(
  businessSlug: string,
  params: {
    serviceId: string;
    priceOptionId?: string;
    addOnIds?: string;
    detailsStep?: BookDetailsStepQuery;
    /** Mobile vs shop when business offers both. */
    serviceLocationType?: BookServiceLocationTypeQuery;
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
  if (
    params.detailsStep === 'addons' ||
    params.detailsStep === 'price' ||
    params.detailsStep === 'location'
  ) {
    q.set('detailsStep', params.detailsStep);
  }
  if (
    params.serviceLocationType === 'mobile' ||
    params.serviceLocationType === 'shop'
  ) {
    q.set('serviceLocationType', params.serviceLocationType);
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
 * Public marketing profile `/{slug}` — adds `?lang=` for non-default funnel
 * locales and `?ref=` when the link comes from a tracked channel.
 */
export function getPublicBusinessProfilePath(
  businessSlug: string,
  options?: { lang?: PublicBookingFlowLocale | null; ref?: string | null }
): string {
  const s = businessSlug.trim();
  if (!s) return '/';
  const base = `/${encodeURIComponent(s)}`;
  const q = new URLSearchParams();
  appendPublicBookingFlowLang(q, options?.lang);
  const ref = options?.ref?.trim();
  if (ref) q.set(BOOKING_REFERRAL_QUERY, ref);
  const query = q.toString();
  return query ? `${base}?${query}` : base;
}

/** Marketplace city SEO page `/find-detailers/{city-slug}`. */
export function getFindDetailersCityPath(citySlug: string): string {
  const slug = citySlug.trim().toLowerCase();
  if (!slug) return ROUTES.FIND_DETAILERS;
  return ROUTES.FIND_DETAILERS_CITY(slug);
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
 * Public membership subscribe step `/{slug}/subscribe?planId=&priceId=`.
 * Explainer + first visit date before Stripe Checkout.
 */
export function getPublicMembershipSubscribePath(
  businessSlug: string,
  options: {
    planId: string;
    priceId: string;
    lang?: PublicBookingFlowLocale | null;
  }
): string {
  const s = businessSlug.trim();
  const planId = options.planId.trim();
  const priceId = options.priceId.trim();
  if (!s || !planId || !priceId) return '/';
  const q = new URLSearchParams();
  q.set('planId', planId);
  q.set('priceId', priceId);
  appendPublicBookingFlowLang(q, options.lang);
  return `/${encodeURIComponent(s)}/subscribe?${q.toString()}`;
}

/**
 * Public membership next-visit scheduler `/{slug}/membership/visit?token=`.
 * Token is the same HMAC shape as manage links (`membershipId.sig`).
 */
export function getPublicMembershipVisitPath(
  businessSlug: string,
  token: string,
  options?: { lang?: PublicBookingFlowLocale | null }
): string {
  const s = businessSlug.trim();
  const t = token.trim();
  if (!s || !t) return '/';
  const q = new URLSearchParams();
  q.set('token', t);
  appendPublicBookingFlowLang(q, options?.lang);
  return `/${encodeURIComponent(s)}/membership/visit?${q.toString()}`;
}

/**
 * Stripe Customer Portal `return_url` path after manage/cancel.
 * Lands on the public booking link Subscriptions tab.
 */
export function getPublicMembershipPortalReturnPath(
  businessSlug: string
): string {
  const base = getPublicBusinessProfilePath(businessSlug);
  if (base === '/') return '/';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}tab=subscriptions`;
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

/** Short branded receipt link for SMS/email (`/r/{shortCode}`). */
export function getPublicInvoiceShortPath(shortCode: string): string {
  const c = shortCode.trim();
  if (!c) return '/r';
  return `/r/${encodeURIComponent(c)}`;
}

/** Owner New appointment wizard with membership visit prefill query params. */
export function getOwnerCreateAppointmentPath(args: {
  membershipId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  planName: string;
  visitDurationMinutes: number;
}): string {
  const q = new URLSearchParams();
  q.set('membershipId', args.membershipId.trim());
  q.set('name', args.name.trim());
  const email = args.email?.trim();
  if (email && email !== '—') q.set('email', email);
  const phone = args.phone?.trim();
  if (phone) {
    const normalized = normalizeUsPhoneDigits(phone);
    if (normalized) q.set('phone', normalized);
  }
  const notes = args.notes?.trim();
  if (notes) q.set('notes', notes);
  q.set('planName', args.planName.trim());
  q.set(
    'durationMinutes',
    String(Math.max(30, Math.round(args.visitDurationMinutes)))
  );
  return `${ROUTES.DASHBOARD.BOOKINGS_NEW}?${q.toString()}`;
}
