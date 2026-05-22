import {
  WORKSHOP_CANONICAL_URL,
  WORKSHOP_CURRICULUM_TOPICS,
  WORKSHOP_HERO,
} from '../data/workshopSeoContent';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';

export function AdsWorkshopStructuredData() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Run Local Ads Workshop',
        item: WORKSHOP_CANONICAL_URL,
      },
    ],
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${WORKSHOP_CANONICAL_URL}#webpage`,
    url: WORKSHOP_CANONICAL_URL,
    name: WORKSHOP_HERO.title,
    description: WORKSHOP_HERO.subtitle,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'ServiceLink', url: SITE_URL },
    about: {
      '@type': 'Thing',
      name: 'Facebook and Instagram advertising for local service businesses',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ServiceLink',
      url: SITE_URL,
    },
  };

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: WORKSHOP_HERO.title,
    description: WORKSHOP_HERO.subtitle,
    url: WORKSHOP_CANONICAL_URL,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    educationalLevel: 'Beginner',
    teaches: WORKSHOP_CURRICULUM_TOPICS.map(t => t.title).join('; '),
    provider: {
      '@type': 'Organization',
      name: 'ServiceLink',
      url: SITE_URL,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT15M',
    },
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'What is covered in the Run Local Ads workshop',
    itemListElement: WORKSHOP_CURRICULUM_TOPICS.map((topic, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: topic.title,
      description: topic.description,
    })),
  };

  const schemas = [
    breadcrumbSchema,
    webPageSchema,
    courseSchema,
    itemListSchema,
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
