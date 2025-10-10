/**
 * Robots.txt Generation
 *
 * Generates robots.txt file to guide search engine crawlers.
 * Allows indexing of public profiles while protecting private areas.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /[business-slug]$
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /settings/
Disallow: /waitlist/

# Sitemap
Sitemap: https://myservicelink.app/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}
