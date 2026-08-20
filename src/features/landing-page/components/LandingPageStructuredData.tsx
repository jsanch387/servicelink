import React from 'react';
import { LANDING_FAQS } from '../data/faqs';
import { HOME_SEO_DESCRIPTION } from '../data/homeSeoContent';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export const LandingPageStructuredData: React.FC = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ServiceLink',
    url: SITE_URL,
    description: HOME_SEO_DESCRIPTION,
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
    description: HOME_SEO_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}#organization` },
    inLanguage: 'en-US',
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ServiceLink',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    url: SITE_URL,
    description: HOME_SEO_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to start; Pro for payments and advanced features',
    },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};
