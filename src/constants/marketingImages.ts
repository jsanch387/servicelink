/** Single source of truth for static marketing assets in `/public`. */
export const MARKETING_IMAGES = {
  brand: {
    logo: '/brand/service-link-logo.png',
    favicon: '/brand/favicon.png',
    faviconIco: '/brand/favicon.ico',
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
  },
  store: {
    googlePlay: '/store/google-play.png',
    appStoreSticker: '/store/appstore-sticker.svg',
  },
} as const;

export type FeatureMarketingImageKey = keyof typeof MARKETING_IMAGES.features;
