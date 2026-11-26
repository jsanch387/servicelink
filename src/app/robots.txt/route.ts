/**
 * Robots.txt Generation
 *
 * Generates robots.txt file to guide search engine crawlers.
 * Allows indexing of public profiles while protecting private areas.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';
  const robotsTxt = `User-agent: *
Allow: /
Allow: /signup
Allow: /login
Allow: /resources
Allow: /resources/
Allow: /auto-detailing
Allow: /faq
Allow: /llms.txt
Allow: /find-detailers
Allow: /find-detailers/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /settings/
Disallow: /waitlist/
Disallow: /__not-found

# Sitemap for discoverability (Google, Bing, AI crawlers)
Sitemap: ${baseUrl}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}
