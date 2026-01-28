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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'ServiceLink - Your Business. One Beautiful Link.',
    template: '%s | ServiceLink',
  },
  description:
    'Stop wasting money on expensive websites. Get a stunning business profile that lets customers call you directly from one beautiful link. Better than Linktree, built for service businesses.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
  },
  keywords: [
    'business profile',
    'service business',
    'professional profile',
    'business link',
    'service directory',
    'small business website',
  ],
  authors: [{ name: 'ServiceLink' }],
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://servicelink.app',
    siteName: 'ServiceLink',
    title: 'ServiceLink - Your Business. One Beautiful Link.',
    description:
      'Stop wasting money on expensive websites. Get a stunning business profile that lets customers call you directly from one beautiful link.',
    images: [
      {
        url: '/og-image.jpg', // You can add this later
        width: 1200,
        height: 630,
        alt: 'ServiceLink - Professional Business Profiles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ServiceLink - Your Business. One Beautiful Link.',
    description:
      'Stop wasting money on expensive websites. Get a stunning business profile that lets customers call you directly from one beautiful link.',
    images: ['/og-image.jpg'], // You can add this later
    creator: '@servicelink', // Update with your actual Twitter handle
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
