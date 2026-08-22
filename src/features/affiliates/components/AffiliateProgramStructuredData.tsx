import {
  AFFILIATE_FAQS,
  AFFILIATE_HERO,
  AFFILIATES_CANONICAL_URL,
} from '../data/affiliateProgramContent';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export function AffiliateProgramStructuredData() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Affiliate program',
        item: AFFILIATES_CANONICAL_URL,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: AFFILIATE_FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: AFFILIATES_CANONICAL_URL,
    name: AFFILIATE_HERO.seoTitle,
    description: AFFILIATE_HERO.seoDescription,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'ServiceLink', url: SITE_URL },
  };

  return (
    <>
      {[breadcrumbSchema, webPageSchema, faqSchema].map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
