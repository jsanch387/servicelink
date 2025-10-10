/**
 * SEO Utility Functions
 *
 * Helper functions for generating SEO-friendly content and metadata.
 * Centralized SEO logic for consistent optimization across the app.
 */

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  imageUrl?: string;
  businessName?: string;
  businessType?: string;
  serviceArea?: string;
}

/**
 * Generates SEO-friendly title
 */
export function generateSEOTitle(data: {
  businessName: string;
  businessType?: string;
  serviceArea?: string;
  suffix?: string;
}): string {
  const {
    businessName,
    businessType,
    serviceArea,
    suffix = 'ServiceLink',
  } = data;

  if (serviceArea && businessType) {
    return `${businessName} - ${businessType} in ${serviceArea} | ${suffix}`;
  } else if (businessType) {
    return `${businessName} - ${businessType} | ${suffix}`;
  } else {
    return `${businessName} | ${suffix}`;
  }
}

/**
 * Generates SEO-friendly description
 */
export function generateSEODescription(data: {
  bio?: string;
  businessName: string;
  businessType?: string;
  serviceArea?: string;
  maxLength?: number;
}): string {
  const {
    bio,
    businessName,
    businessType,
    serviceArea,
    maxLength = 160,
  } = data;

  let description =
    bio ||
    `Professional ${businessType?.toLowerCase() || 'services'} by ${businessName}`;

  if (serviceArea) {
    description += ` serving ${serviceArea}`;
  }

  if (description.length > maxLength) {
    description = `${description.substring(0, maxLength - 3)}...`;
  }

  return description;
}

/**
 * Generates keywords array from business data
 */
export function generateSEOKeywords(data: {
  businessName: string;
  businessType?: string;
  serviceArea?: string;
  additionalKeywords?: string[];
}): string[] {
  const {
    businessName,
    businessType,
    serviceArea,
    additionalKeywords = [],
  } = data;

  const keywords = [
    businessName,
    businessType,
    serviceArea,
    'professional services',
    'business profile',
    'contact directly',
    'ServiceLink',
    ...additionalKeywords,
  ].filter((k): k is string => Boolean(k));

  // Remove duplicates and return
  return [...new Set(keywords)];
}

/**
 * Validates URL for SEO
 */
export function isValidSEOUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.includes('myservicelink.app')
    );
  } catch {
    return false;
  }
}

/**
 * Formats phone number for structured data
 */
export function formatPhoneForSEO(phone: string): string {
  // Remove all non-digit characters and format for international use
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return phone;
}

/**
 * Generates breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{
    name: string;
    url: string;
  }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url,
    })),
  };
}

/**
 * Generates FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{
    question: string;
    answer: string;
  }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
