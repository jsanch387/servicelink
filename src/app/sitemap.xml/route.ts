/**
 * Dynamic Sitemap Generation
 *
 * Generates a sitemap.xml file with all public pages: home, auth, legal,
 * resources (guides), and business profiles. Helps search engines and AI
 * crawlers discover and index content.
 */

import { isPublicBusinessProfileLive } from '@/features/pricing/utils/publicBusinessProfileLive';
import { GUIDES } from '@/features/resources';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import { NextResponse } from 'next/server';

/** Explicit row shape — Supabase `.not(..., 'is', null)` can infer `never` for `data` in some TS versions. */
type SitemapBusinessProfileRow = Pick<
  Database['public']['Tables']['business_profiles']['Row'],
  'business_slug' | 'updated_at' | 'profile_id'
>;

type IndexedSitemapProfile = SitemapBusinessProfileRow & {
  business_slug: string;
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: profiles, error } = await supabase
      .from('business_profiles')
      .select('business_slug, updated_at, profile_id')
      .not('business_slug', 'is', null);

    if (error) {
      console.error('Error fetching profiles for sitemap:', error);
      return new NextResponse('Error generating sitemap', { status: 500 });
    }

    const rows: SitemapBusinessProfileRow[] = (profiles ??
      []) as SitemapBusinessProfileRow[];
    const ownerIds = [
      ...new Set(
        rows
          .map(p => p.profile_id?.trim())
          .filter((id): id is string => Boolean(id))
      ),
    ];

    let ownersByUserId = new Map<string, Record<string, unknown>>();
    if (ownerIds.length > 0) {
      const { data: owners, error: ownersError } = await supabase
        .from('profiles')
        .select(
          'user_id, onboarding_status, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
        )
        .in('user_id', ownerIds);

      if (ownersError) {
        console.error('Error fetching owners for sitemap:', ownersError);
        return new NextResponse('Error generating sitemap', { status: 500 });
      }

      ownersByUserId = new Map(
        (owners || []).map(o => [
          (o as { user_id: string }).user_id,
          o as Record<string, unknown>,
        ])
      );
    }

    const indexedProfiles = rows.filter((p): p is IndexedSitemapProfile => {
      const slug = p.business_slug;
      if (!slug?.trim()) return false;
      const pid = p.profile_id?.trim();
      if (!pid) return true;
      const owner = ownersByUserId.get(pid);
      if (!owner) return false;
      return isPublicBusinessProfileLive({
        onboarding_status: owner.onboarding_status as string | null,
        subscription_tier: owner.subscription_tier as string | null,
        subscription_current_period_end:
          owner.subscription_current_period_end as string | null,
        subscription_status: owner.subscription_status as string | null,
        stripe_subscription_id: owner.stripe_subscription_id as string | null,
        stripe_customer_id: owner.stripe_customer_id as string | null,
      });
    });

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
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/workshop</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>${resourcesUrls}
${indexedProfiles
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
