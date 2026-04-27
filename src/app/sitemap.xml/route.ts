/**
 * Dynamic Sitemap Generation
 *
 * Generates a sitemap.xml file with all public pages: home, auth, legal,
 * resources (guides), and business profiles. Helps search engines and AI
 * crawlers discover and index content.
 */

import { GUIDES } from '@/features/resources';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    // Use direct client (no cookies needed for public data)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all business profiles with slugs
    const { data: profiles, error } = await supabase
      .from('business_profiles')
      .select('business_slug, updated_at')
      .not('business_slug', 'is', null);

    if (error) {
      console.error('Error fetching profiles for sitemap:', error);
      return new NextResponse('Error generating sitemap', { status: 500 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app';
    const currentDate = new Date().toISOString();

    // Resources index and guide URLs for SEO
    const resourcesUrls = `
  <url>
    <loc>${baseUrl}/resources</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${GUIDES.map(
  guide => `  <url>
    <loc>${baseUrl}/resources/${guide.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
).join('\n')}`;

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>${resourcesUrls}
${(profiles || [])
  .map(
    profile => `  <url>
    <loc>${baseUrl}/${profile.business_slug}</loc>
    <lastmod>${new Date(profile.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
