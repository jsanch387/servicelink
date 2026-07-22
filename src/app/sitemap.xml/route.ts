/**
 * Dynamic Sitemap Generation
 *
 * Public marketing pages + **active Pro** business profiles only.
 * Free / abandoned / churned accounts stay reachable via direct link but are
 * omitted so Google crawl budget isn’t spent on thin tire-kicker pages.
 */

import { isMarketplacePublicEnabled } from '@/features/marketplace/config/isMarketplacePublicEnabled';
import { MARKETPLACE_CITIES } from '@/features/marketplace/config/marketplaceCities';
import { isProAccess } from '@/features/pricing/utils/isProAccess';
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

type SitemapOwnerRow = {
  user_id: string;
  onboarding_status: string | null;
  subscription_tier: string | null;
  subscription_current_period_end: string | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
};

/** Keep `.in()` URL size under PostgREST limits (large UUID lists → 400 Bad Request). */
const OWNER_LOOKUP_BATCH_SIZE = 100;

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

async function fetchOwnersByUserId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  ownerIds: string[]
): Promise<Map<string, SitemapOwnerRow>> {
  const ownersByUserId = new Map<string, SitemapOwnerRow>();

  for (let i = 0; i < ownerIds.length; i += OWNER_LOOKUP_BATCH_SIZE) {
    const batch = ownerIds.slice(i, i + OWNER_LOOKUP_BATCH_SIZE);
    const { data: owners, error: ownersError } = await supabase
      .from('profiles')
      .select(
        'user_id, onboarding_status, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
      )
      .in('user_id', batch);

    if (ownersError) {
      throw ownersError;
    }

    for (const owner of (owners ?? []) as SitemapOwnerRow[]) {
      ownersByUserId.set(owner.user_id, owner);
    }
  }

  return ownersByUserId;
}

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

    let ownersByUserId = new Map<string, SitemapOwnerRow>();
    if (ownerIds.length > 0) {
      try {
        ownersByUserId = await fetchOwnersByUserId(supabase, ownerIds);
      } catch (ownersError) {
        console.error('Error fetching owners for sitemap:', ownersError);
        return new NextResponse('Error generating sitemap', { status: 500 });
      }
    }

    // Index only live Pro businesses (onboarding complete + current Pro access).
    const indexedProfiles = rows.filter((p): p is IndexedSitemapProfile => {
      const slug = p.business_slug;
      if (!slug?.trim()) return false;
      const pid = p.profile_id?.trim();
      if (!pid) return false;
      const owner = ownersByUserId.get(pid);
      if (!owner) return false;
      if (
        !isPublicBusinessProfileLive({
          onboarding_status: owner.onboarding_status,
          subscription_tier: owner.subscription_tier,
          subscription_current_period_end:
            owner.subscription_current_period_end,
          subscription_status: owner.subscription_status,
          stripe_subscription_id: owner.stripe_subscription_id,
          stripe_customer_id: owner.stripe_customer_id,
        })
      ) {
        return false;
      }
      return isProAccess(
        owner.subscription_tier,
        owner.subscription_current_period_end,
        owner.subscription_status,
        owner.stripe_subscription_id,
        owner.stripe_customer_id
      );
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
${GUIDES.map(guide => {
  const lastmod = guide.dateModified || guide.datePublished || currentDate;
  return `  <url>
    <loc>${baseUrl}/resources/${guide.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
}).join('\n')}`;

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
    <loc>${baseUrl}/features</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/pricing</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/workshop</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>${resourcesUrls}
${
  isMarketplacePublicEnabled()
    ? `  <url>
    <loc>${baseUrl}/find-detailers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${MARKETPLACE_CITIES.map(
  city => `  <url>
    <loc>${baseUrl}/find-detailers/${city.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`
).join('\n')}`
    : ''
}
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
