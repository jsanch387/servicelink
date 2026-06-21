import { GUIDES } from '../data/guides';
import {
  RESOURCES_CANONICAL_URL,
  RESOURCES_FAQS,
  RESOURCES_HERO,
  RESOURCES_META_DESCRIPTION,
  RESOURCES_PAGE_SEO_TITLE,
} from '../data/resourcesSeoContent';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

const ORGANIZATION_ID = `${SITE_URL}#organization`;

export function ResourcesStructuredData() {
  const sortedGuides = [...GUIDES].sort((a, b) => {
    const aTime = a.datePublished ? Date.parse(a.datePublished) : 0;
    const bTime = b.datePublished ? Date.parse(b.datePublished) : 0;
    return bTime - aTime;
  });

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'ServiceLink',
    url: SITE_URL,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Resources',
        item: RESOURCES_CANONICAL_URL,
      },
    ],
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${RESOURCES_CANONICAL_URL}#webpage`,
    url: RESOURCES_CANONICAL_URL,
    name: RESOURCES_PAGE_SEO_TITLE,
    headline: RESOURCES_HERO.title,
    description: RESOURCES_META_DESCRIPTION,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'ServiceLink',
      url: SITE_URL,
    },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: sortedGuides.length,
      itemListElement: sortedGuides.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: guide.title,
        url: `${SITE_URL}/resources/${guide.slug}`,
        item: {
          '@type': 'Article',
          headline: guide.title,
          description: guide.metaDescription || guide.subheading,
          url: `${SITE_URL}/resources/${guide.slug}`,
          ...(guide.datePublished && { datePublished: guide.datePublished }),
          publisher: { '@id': ORGANIZATION_ID },
        },
      })),
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: RESOURCES_FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const schemas = [
    organizationSchema,
    breadcrumbSchema,
    collectionPageSchema,
    faqSchema,
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
