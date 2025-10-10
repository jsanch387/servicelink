/**
 * Structured Data Component
 *
 * Generates JSON-LD structured data for better SEO and search engine understanding.
 * Helps search engines understand the business information and improves search results.
 */

import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import React from 'react';

interface StructuredDataProps {
  businessProfile: CompleteBusinessProfile;
  slug: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  businessProfile,
  slug,
}) => {
  // Generate structured data for Local Business
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessProfile.business_name,
    description:
      businessProfile.bio || `${businessProfile.business_type} services`,
    url: `https://myservicelink.app/${slug}`,
    image: businessProfile.cover_image_url || businessProfile.logo_url,
    logo: businessProfile.logo_url,
    telephone: businessProfile.phone_number_call,
    email: businessProfile.email,
    address: businessProfile.service_area
      ? {
          '@type': 'PostalAddress',
          addressLocality: businessProfile.service_area.split(',')[0]?.trim(),
          addressRegion: businessProfile.service_area.split(',')[1]?.trim(),
          addressCountry: 'US',
        }
      : undefined,
    areaServed: businessProfile.service_area
      ? {
          '@type': 'City',
          name: businessProfile.service_area.split(',')[0]?.trim(),
        }
      : undefined,
    serviceType: businessProfile.business_type,
    hasOfferCatalog: businessProfile.services?.length
      ? {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: businessProfile.services.map((service, index) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
              description: service.description,
              provider: {
                '@type': 'LocalBusiness',
                name: businessProfile.business_name,
              },
            },
            price: service.price_cents
              ? (service.price_cents / 100).toString()
              : undefined,
            priceCurrency: 'USD',
            position: index + 1,
          })),
        }
      : undefined,
    makesOffer: businessProfile.services?.map(service => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
      },
      price: service.price_cents
        ? (service.price_cents / 100).toString()
        : undefined,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    })),
    potentialAction: {
      '@type': 'ContactAction',
      target: `tel:${businessProfile.phone_number_call}`,
    },
    sameAs: businessProfile.website ? [businessProfile.website] : undefined,
    foundingDate: businessProfile.created_at,
    aggregateRating: businessProfile.images?.length
      ? {
          '@type': 'AggregateRating',
          ratingValue: '5.0',
          reviewCount: businessProfile.images.length,
          bestRating: '5',
          worstRating: '1',
        }
      : undefined,
  };

  // Remove undefined properties to clean up the JSON
  const cleanStructuredData = JSON.parse(
    JSON.stringify(structuredData, (key, value) =>
      value === undefined ? undefined : value
    )
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(cleanStructuredData, null, 2),
      }}
    />
  );
};
