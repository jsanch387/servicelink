import { GUIDES } from '../data/guides';
import {
  RESOURCES_CANONICAL_URL,
  RESOURCES_FAQS,
  RESOURCES_HERO,
} from '../data/resourcesSeoContent';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export function ResourcesStructuredData() {
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

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${RESOURCES_CANONICAL_URL}#webpage`,
    url: RESOURCES_CANONICAL_URL,
    name: RESOURCES_HERO.title,
    description: `${RESOURCES_HERO.subtitle} ${RESOURCES_HERO.description}`,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'ServiceLink', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'ServiceLink',
      url: SITE_URL,
    },
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: RESOURCES_HERO.title,
    description: `${RESOURCES_HERO.subtitle} ${RESOURCES_HERO.description}`,
    url: RESOURCES_CANONICAL_URL,
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
          headline: guide.title,
          description: guide.metaDescription || guide.subheading,
          url: `${SITE_URL}/resources/${guide.slug}`,
          ...(guide.datePublished && { datePublished: guide.datePublished }),
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
    breadcrumbSchema,
    webPageSchema,
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
