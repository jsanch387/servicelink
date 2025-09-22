import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
