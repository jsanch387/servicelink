/** Single source of truth for static marketing assets in `/public`. */
export const MARKETING_IMAGES = {
  brand: {
    logo: '/brand/service-link-logo.png',
    favicon: '/brand/favicon.png',
    faviconIco: '/brand/favicon.ico',
    /** Circular opaque-black icon for Google Search (circle-cropped in results). */
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
  marketplace: {
    boat: '/marketplace/boat.png',
    ceramic: '/marketplace/ceramic.png',
    exterior: '/marketplace/exterior.png',
    interiorOne: '/marketplace/inside-1.png',
    interiorTwo: '/marketplace/interior-2.png',
    /** 1200×630 share card for /find-detailers (Facebook, iMessage, etc.). */
    openGraph: '/marketplace/find-detailers-og.png',
  },
  resources: {
    bookingApp: '/marketing/resources/guide-booking-app-cover.webp',
    deposits: '/marketing/resources/guide-deposits-cover.webp',
    instagram: '/marketing/resources/guide-instagram-cover.webp',
    comparison2026:
      '/marketing/resources/guide-servicelink-vs-detailermade-cover.webp',
    startBusiness:
      '/marketing/resources/guide-start-mobile-detailing-cover.webp',
  },
  store: {
    googlePlay: '/store/google-play.png',
    appStoreSticker: '/store/appstore-sticker.svg',
  },
} as const;

export type FeatureMarketingImageKey = keyof typeof MARKETING_IMAGES.features;
