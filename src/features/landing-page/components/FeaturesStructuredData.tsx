import { MARKETING_IMAGES } from '@/constants/marketingImages';
import {
  FEATURES_CANONICAL_URL,
  FEATURES_FAQS,
  FEATURES_HERO,
  getFeaturesSeoFeatureList,
} from '../data/featuresSeoContent';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

const FEATURES_OG_IMAGE = MARKETING_IMAGES.brand.openGraph.startsWith('http')
  ? MARKETING_IMAGES.brand.openGraph
  : `${SITE_URL}${MARKETING_IMAGES.brand.openGraph}`;

export function FeaturesStructuredData() {
  const features = getFeaturesSeoFeatureList();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Features',
        item: FEATURES_CANONICAL_URL,
      },
    ],
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${FEATURES_CANONICAL_URL}#webpage`,
    url: FEATURES_CANONICAL_URL,
    name: FEATURES_HERO.seoTitle,
    headline: FEATURES_HERO.seoTitle,
    description: FEATURES_HERO.seoDescription,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'ServiceLink', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'ServiceLink',
      url: SITE_URL,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: FEATURES_OG_IMAGE,
    },
    about: {
      '@type': 'SoftwareApplication',
      name: 'ServiceLink',
      applicationCategory: 'BusinessApplication',
    },
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ServiceLink',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    url: SITE_URL,
    description: FEATURES_HERO.seoDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description:
        'Free plan available; Pro subscription for payments and advanced features',
    },
    featureList: features.map(feature => feature.name),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ServiceLink booking and business management features',
    numberOfItems: features.length,
    itemListElement: features.map((feature, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: feature.name,
      description: feature.description,
      url: `${FEATURES_CANONICAL_URL}#${feature.id}`,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FEATURES_FAQS.map(faq => ({
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
    softwareSchema,
    itemListSchema,
    faqSchema,
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
