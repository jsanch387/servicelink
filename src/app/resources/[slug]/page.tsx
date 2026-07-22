import { ROUTES } from '@/constants/routes';
import { GuideKeyTakeaways } from '@/features/resources/components/GuideCallouts';
import { GUIDES, getGuideBySlug } from '@/features/resources';
import { getGuideContentComponent } from '@/features/resources/content';
import { MarketingFooter } from '@/features/landing-page/components/MarketingFooter';
import { MarketingNavigation } from '@/features/landing-page/components/MarketingNavigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

interface ResourceGuidePageProps {
  params: Promise<{ slug: string }>;
}

function formatGuideDate(datePublished?: string): string | null {
  if (!datePublished) return null;
  return new Date(datePublished).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generateStaticParams() {
  return GUIDES.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: ResourceGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: 'Guide Not Found' };
  }

  const description = guide.metaDescription || guide.subheading;
  const canonicalUrl = `${SITE_URL}/resources/${slug}`;
  const keywordsList = guide.keywords ?? [
    'mobile car detailing',
    'booking link for detailers',
    'ServiceLink',
  ];
  const keywords = keywordsList.join(', ');
  const socialTitle = `${guide.title} | ServiceLink`;
  const publishedTime = guide.datePublished;
  const modifiedTime = guide.dateModified || guide.datePublished;

  return {
    title: guide.title,
    description,
    keywords,
    authors: [{ name: 'ServiceLink', url: SITE_URL }],
    creator: 'ServiceLink',
    publisher: 'ServiceLink',
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      siteName: 'ServiceLink',
      type: 'article',
      locale: 'en_US',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      authors: ['ServiceLink'],
      section: 'Resources',
      tags: [...keywordsList],
      images: [
        {
          url: guide.coverImage,
          width: 1200,
          height: 750,
          alt: guide.coverImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [guide.coverImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
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
  const dateLabel = formatGuideDate(guide.datePublished);

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription || guide.subheading,
    url: canonicalUrl,
    inLanguage: 'en-US',
    articleSection: 'Resources',
    ...(guide.keywords?.length && {
      keywords: guide.keywords.join(', '),
    }),
    image: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${guide.coverImage}`,
      width: 1200,
      height: 750,
      caption: guide.coverImageAlt,
    },
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
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/brand/service-link-logo.png`,
      },
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

  const faqStructuredData = guide.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  const structuredDataScripts = [
    articleStructuredData,
    breadcrumbStructuredData,
    ...(faqStructuredData ? [faqStructuredData] : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex flex-col">
      {structuredDataScripts.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <MarketingNavigation />
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-14 pb-14 sm:pb-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link
                href="/"
                className="cursor-pointer hover:text-white transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden className="text-gray-600">
              /
            </li>
            <li>
              <Link
                href={ROUTES.RESOURCES}
                className="cursor-pointer hover:text-white transition-colors"
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
            {guide.title}
          </h1>

          {dateLabel ? (
            <p className="text-sm text-gray-500 mb-6">
              <time dateTime={guide.datePublished}>{dateLabel}</time>
              <span aria-hidden className="mx-2 text-gray-600">
                ·
              </span>
              <span>ServiceLink</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-6">ServiceLink</p>
          )}

          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-8">
            <Image
              src={guide.coverImage}
              alt={guide.coverImageAlt}
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>

          <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-8">
            {guide.subheading}
          </p>

          {guide.keyTakeaways?.length ? (
            <GuideKeyTakeaways items={guide.keyTakeaways} />
          ) : null}

          {GuideContent ? (
            <div className="max-w-none">
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
      <MarketingFooter />
    </div>
  );
}
