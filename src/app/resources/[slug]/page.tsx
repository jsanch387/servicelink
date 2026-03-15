import { ROUTES } from '@/constants/routes';
import { Navigation } from '@/features/landing-page/components/Navigation';
import { getGuideBySlug } from '@/features/resources';
import { getGuideContentComponent } from '@/features/resources/content';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

interface ResourceGuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ResourceGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: 'Guide Not Found' };
  }

  const title = `${guide.title} | ServiceLink`;
  const description = guide.metaDescription || guide.subheading;
  const canonicalUrl = `${SITE_URL}/resources/${slug}`;
  const keywords = [
    'mobile car detailing',
    'get clients from Instagram',
    'Instagram for detailers',
    'TikTok for car detailing',
    'detailing business marketing',
    'booking link for detailers',
    'ServiceLink',
  ].join(', ');

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'ServiceLink',
      type: 'article',
      locale: 'en_US',
      images: [
        { url: '/open-graph.png', width: 1200, height: 630, alt: guide.title },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
}

export default async function ResourceGuidePage({
  params,
}: ResourceGuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const GuideContent = getGuideContentComponent(slug);
  const canonicalUrl = `${SITE_URL}/resources/${slug}`;

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription || guide.subheading,
    url: canonicalUrl,
    inLanguage: 'en-US',
    author: {
      '@type': 'Organization',
      name: 'ServiceLink',
      url: SITE_URL,
    },
    ...(guide.datePublished && {
      datePublished: guide.datePublished,
      dateModified: guide.dateModified || guide.datePublished,
    }),
    publisher: {
      '@type': 'Organization',
      name: 'ServiceLink',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
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
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData),
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-gray-600">
              /
            </li>
            <li>
              <Link
                href={ROUTES.RESOURCES}
                className="hover:text-white transition-colors"
              >
                Resources
              </Link>
            </li>
            <li aria-hidden className="text-gray-600">
              /
            </li>
            <li
              className="text-gray-400 truncate max-w-[200px] sm:max-w-none"
              aria-current="page"
            >
              {guide.title}
            </li>
          </ol>
        </nav>
        <article itemScope itemType="https://schema.org/Article">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
            {guide.title}
          </h1>
          <p className="text-gray-400 text-lg mb-10">{guide.subheading}</p>

          {GuideContent ? (
            <div className="prose prose-invert max-w-none">
              <GuideContent />
            </div>
          ) : (
            <p className="text-gray-500">
              Guide content will go here. Add your blog post or guide body when
              you’re ready.
            </p>
          )}
        </article>
      </main>

      {/* Footer */}
      <footer className="mt-16 sm:mt-20 py-8 px-4 border-t border-[var(--dashboard-border)] text-center">
        <Link
          href={ROUTES.RESOURCES}
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back to Resources
        </Link>
      </footer>
    </div>
  );
}
