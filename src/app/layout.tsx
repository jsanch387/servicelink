/* eslint-disable @next/next/no-img-element */
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { MarketingAttributionRoot } from '@/features/marketing-attribution';
import {
  HOME_SEO_DESCRIPTION,
  HOME_SEO_TITLE,
} from '@/features/landing-page/data/homeSeoContent';
import { ToastViewport } from '@/components/shared';
import type { Metadata } from 'next';
import {
  Geist,
  Geist_Mono,
  Inter,
  Manrope,
  Outfit,
  Plus_Jakarta_Sans,
  Poppins,
  Space_Grotesk,
} from 'next/font/google';
import Script from 'next/script';
import { Suspense } from 'react';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1456318202654985';
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18403168896';
const gaMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-7S62H6CP84';
const gtagPrimaryId = gaMeasurementId || googleAdsId;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'ServiceLink',
  title: {
    default: HOME_SEO_TITLE,
    template: '%s | ServiceLink',
  },
  description: HOME_SEO_DESCRIPTION,
  icons: {
    icon: [
      {
        url: MARKETING_IMAGES.brand.favicon,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: MARKETING_IMAGES.brand.favicon,
        sizes: '512x512',
        type: 'image/png',
      },
      { url: MARKETING_IMAGES.brand.faviconIco, sizes: 'any' },
      // Google Search circle-crops this 48×48 — file is a round disc so it isn’t a clipped square.
      {
        url: MARKETING_IMAGES.brand.googleSiteIcon48,
        sizes: '48x48',
        type: 'image/png',
      },
    ],
    shortcut: [{ url: MARKETING_IMAGES.brand.favicon, type: 'image/png' }],
    apple: [
      {
        url: MARKETING_IMAGES.brand.favicon,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  keywords: [
    'booking software for detailers',
    'booking software built for detailers',
    'booking app for mobile detailers',
    'mobile detailers',
    'mobile detailing booking app',
    'booking link for business',
    'service business link',
    'myservicelink',
    'get booked',
    'service pros',
    'detailer booking',
    'pressure washing booking',
    'lawn care booking',
    'professional booking link',
    'one link business',
    'service business website alternative',
  ],
  authors: [{ name: 'ServiceLink', url: siteUrl }],
  creator: 'ServiceLink',
  publisher: 'ServiceLink',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Link previews: brand/open-graph.png must exist and be 1200×630px (1.91:1) for optimal ratio.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'ServiceLink',
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    images: [
      {
        url: MARKETING_IMAGES.brand.openGraph,
        width: 1200,
        height: 630,
        alt: 'ServiceLink — booking app for mobile detailers.',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    images: [MARKETING_IMAGES.brand.openGraph],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#171717" />
        {gtagPrimaryId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gtagPrimaryId}`}
              strategy="afterInteractive"
            />
            <Script id="google-gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${gaMeasurementId ? `gtag('config', '${gaMeasurementId}');` : ''}
                ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
              `}
            </Script>
          </>
        ) : null}
        {metaPixelId ? (
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} ${outfit.variable} ${manrope.variable} ${poppins.variable} ${plusJakartaSans.variable} antialiased`}
      >
        {metaPixelId ? (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
        <Suspense fallback={null}>
          <MarketingAttributionRoot />
        </Suspense>
        {children}
        <ToastViewport />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
