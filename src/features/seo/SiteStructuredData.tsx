import React from 'react';
import { buildSiteSoftwareJsonLd } from './siteJsonLd';

export function SiteStructuredData() {
  const { organization, software } = buildSiteSoftwareJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
