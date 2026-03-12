import { Navigation } from '@/features/landing-page/components/Navigation';
import { GuideCard, GUIDES } from '@/features/resources';
import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const metadata: Metadata = {
  title: 'Resources – Guides for Service Businesses | ServiceLink',
  description:
    'Free guides and tips to grow your service business: get clients from Instagram and TikTok, create a booking link, and turn viewers into customers. Written for mobile detailers and service pros.',
  keywords: [
    'service business marketing',
    'get clients from Instagram',
    'booking link for businesses',
    'mobile detailing marketing',
    'ServiceLink resources',
  ].join(', '),
  alternates: {
    canonical: `${SITE_URL}/resources`,
  },
  openGraph: {
    title: 'Resources – Guides for Service Businesses | ServiceLink',
    description:
      'Free guides and tips to grow your service business and get more bookings from social media.',
    url: `${SITE_URL}/resources`,
    siteName: 'ServiceLink',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/open-graph.png',
        width: 1200,
        height: 630,
        alt: 'ServiceLink Resources',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resources – Guides for Service Businesses | ServiceLink',
    description:
      'Free guides and tips to grow your service business and get more bookings from social media.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
};

export default function ResourcesPage() {
  const webPageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Resources – Guides for Service Businesses | ServiceLink',
    description:
      'Free guides and tips to grow your service business: get clients from Instagram and TikTok, create a booking link, and turn viewers into customers.',
    url: `${SITE_URL}/resources`,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'ServiceLink',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GUIDES.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          name: guide.title,
          description: guide.subheading,
          url: `${SITE_URL}/resources/${guide.slug}`,
        },
      })),
    },
  };

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Resources',
        item: `${SITE_URL}/resources`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <Navigation />
      {/* Spacer: matches fixed nav height so content starts below it */}
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      {/* Visible gap between nav and content */}
      <div className="h-12 sm:h-16 shrink-0" aria-hidden />
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight">
          Resources
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mb-10">
          Helpful guides, blogs, and tips to grow your business and get clients
          organically on social media—detailed steps, free to use.
        </p>

        <section className="space-y-4" aria-label="Guides and articles">
          {GUIDES.map(guide => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 sm:mt-20 py-8 px-4 border-t border-[var(--dashboard-border)] text-center">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>
      </footer>
    </div>
  );
}
