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
    AVAILABILITY: '/dashboard/availability',
    SETTINGS: '/dashboard/settings',
  },
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
