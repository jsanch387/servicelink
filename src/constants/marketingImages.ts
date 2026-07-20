/** Single source of truth for static marketing assets in `/public`. */
export const MARKETING_IMAGES = {
  brand: {
    logo: '/brand/service-link-logo.png',
    favicon: '/brand/favicon.png',
    faviconIco: '/brand/favicon.ico',
    /** Opaque dark-bg icon for Google Search / Organization schema only. */
    googleSiteIcon: '/brand/google-site-icon.png',
    googleSiteIcon48: '/brand/google-site-icon-48.png',
    openGraph: '/brand/open-graph.png',
  },
  features: {
    bookingLink: '/marketing/features/booking-link.png',
    calendar: '/marketing/features/calendar.png',
    homeScreen: '/marketing/features/home-screen.png',
    payments: '/marketing/features/payments.png',
    services: '/marketing/features/services.png',
  },
  landing: {
    heroMock: '/marketing/landing/landing-page-mock.png',
    display: '/marketing/landing/landing-page-display.png',
  },
  resources: {
    bookingApp: '/marketing/resources/guide-booking-app-cover.webp',
    deposits: '/marketing/resources/guide-deposits-cover.webp',
    instagram: '/marketing/resources/guide-instagram-cover.webp',
  },
  store: {
    googlePlay: '/store/google-play.png',
    appStoreSticker: '/store/appstore-sticker.svg',
  },
} as const;

export type FeatureMarketingImageKey = keyof typeof MARKETING_IMAGES.features;
