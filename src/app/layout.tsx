import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      'ServiceLink | One Link for Your Service Business — Get Booked Instantly',
    template: '%s | ServiceLink',
  },
  description:
    'Create a professional booking link for your service business. Share one link—myservicelink.app/yourbusiness—and let customers see your services and book instantly. Built for detailers, pressure washers, lawn care, and service pros.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
  },
  keywords: [
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
  // Link previews (Facebook, LinkedIn, iMessage, Slack): title, description, image from here (public/open-graph.png).
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'ServiceLink',
    title:
      'ServiceLink | One Link for Your Service Business — Get Booked Instantly',
    description:
      'Create a professional booking link. Share one link and let customers see your services and book instantly. Built for service pros.',
    images: [
      {
        url: `${siteUrl}/open-graph.png`,
        width: 1200,
        height: 630,
        alt: 'ServiceLink — Your business, ready to book.',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'ServiceLink | One Link for Your Service Business — Get Booked Instantly',
    description:
      'Create a professional booking link. Share one link and let customers see your services and book instantly.',
    images: [`${siteUrl}/open-graph.png`],
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} ${outfit.variable} ${manrope.variable} ${poppins.variable} ${plusJakartaSans.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
