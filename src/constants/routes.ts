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
  },

  // Dashboard routes
  DASHBOARD: {
    MAIN: '/dashboard',
    BUSINESS_PROFILE: '/dashboard/business-profile',
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
