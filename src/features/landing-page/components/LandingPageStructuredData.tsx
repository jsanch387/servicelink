import React from 'react';
import { LANDING_FAQS } from '../data/faqs';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const LandingPageStructuredData: React.FC = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ServiceLink',
    url: SITE_URL,
    description:
      'One link for your service business. Share it anywhere—customers see your services and book instantly.',
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/brand/google-site-icon.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/brand/google-site-icon.png`,
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: 'ServiceLink',
    url: SITE_URL,
    description:
      'One link for your service business. Share it anywhere—customers see your services and book instantly. Built for detailers, pressure washers, lawn care, and service pros.',
    publisher: { '@id': `${SITE_URL}#organization` },
    inLanguage: 'en-US',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...organizationSchema,
            '@id': `${SITE_URL}#organization`,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};
