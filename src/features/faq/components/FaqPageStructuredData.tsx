import { ROUTES } from '@/constants/routes';
import { FAQ_PAGE_ENTRIES, FAQ_PAGE_TITLE } from '../data/faqPageContent';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
).replace(/\/$/, '');

export function FaqPageStructuredData() {
  const canonical = `${SITE_URL}${ROUTES.FAQ}`;

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    url: canonical,
    name: FAQ_PAGE_TITLE,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'ServiceLink', url: SITE_URL },
    mainEntity: FAQ_PAGE_ENTRIES.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FAQ',
        item: canonical,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}
