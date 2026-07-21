/* eslint-disable @typescript-eslint/no-explicit-any */

import { isPublicBusinessProfileLive } from '@/features/pricing/utils/publicBusinessProfileLive';
import { MEDIA_CONFIG } from '@/features/media/media.types';
import type {
  MarketplaceBusiness,
  MarketplaceSearchResponse,
} from '@/features/marketplace/types/marketplace';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertPublicMarketplaceSearchRateLimit } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

const MAX_LOCATION_LENGTH = 100;
const MAX_RESULTS = 50;

interface ParsedLocation {
  display: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}

function normalizeWords(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLocation(value: string): ParsedLocation | null {
  const display = value.replace(/\s+/g, ' ').trim();
  if (!display || display.length > MAX_LOCATION_LENGTH) return null;

  const zip = display.match(/\b\d{5}\b/)?.[0] ?? null;
  if (zip && /^\d{5}$/.test(display)) {
    return { display, city: null, state: null, zip };
  }

  const [beforeComma = '', afterComma = ''] = display.split(',');
  const cityCandidate = beforeComma || display;
  const state =
    afterComma
      .trim()
      .match(/^([a-z]{2})\b/i)?.[1]
      ?.toUpperCase() ??
    display.match(/\s([a-z]{2})$/i)?.[1]?.toUpperCase() ??
    null;
  const city = normalizeWords(
    cityCandidate.replace(/\s+[a-z]{2}$/i, '').trim()
  );

  if (city.length < 2 || city === 'current location') return null;
  return { display, city, state, zip };
}

function publicStorageUrl(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  path: string | null
): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;
  return admin.storage.from(MEDIA_CONFIG.bucketName).getPublicUrl(trimmed).data
    .publicUrl;
}

export async function GET(request: NextRequest) {
  const rateLimited = await assertPublicMarketplaceSearchRateLimit(request);
  if (rateLimited) return rateLimited;

  const parsed = parseLocation(
    request.nextUrl.searchParams.get('location') ?? ''
  );
  if (!parsed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Enter a city, state, or five-digit ZIP code.',
      } satisfies MarketplaceSearchResponse,
      { status: 400 }
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    let candidateQuery = (admin as any)
      .from('business_profiles')
      .select(
        'id, profile_id, business_name, business_slug, business_type, service_area, business_zip, service_location_mode, bio, logo_path, banner_path'
      )
      .ilike('business_type', '%detail%')
      .not('business_slug', 'is', null)
      .limit(MAX_RESULTS);

    candidateQuery = parsed.zip
      ? candidateQuery.eq('business_zip', parsed.zip)
      : candidateQuery.ilike('service_area', `%${parsed.city}%`);

    const { data: candidateData, error: candidateError } = await candidateQuery;
    if (candidateError) throw candidateError;

    const candidates = ((candidateData ?? []) as any[]).filter(candidate => {
      if (
        !candidate.profile_id?.trim() ||
        !candidate.business_slug?.trim() ||
        !candidate.service_area?.trim()
      ) {
        return false;
      }
      if (!parsed.city) return true;
      if (!normalizeWords(candidate.service_area).includes(parsed.city)) {
        return false;
      }

      const listedStates = (
        candidate.service_area.match(/\b[A-Z]{2}\b/gi) ?? []
      ).map((state: string) => state.toUpperCase());
      return (
        !parsed.state ||
        listedStates.length === 0 ||
        listedStates.includes(parsed.state)
      );
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        location: parsed.display,
        businesses: [],
      } satisfies MarketplaceSearchResponse);
    }

    const profileIds = candidates
      .map(candidate => candidate.profile_id?.trim())
      .filter(Boolean);
    const businessIds = candidates.map(candidate => candidate.id);

    const [ownersResult, servicesResult, reviewsResult] = await Promise.all([
      (admin as any)
        .from('profiles')
        .select(
          'user_id, onboarding_status, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
        )
        .in('user_id', profileIds),
      (admin as any)
        .from('business_services')
        .select('id, business_id, name, price_cents, sort_order')
        .in('business_id', businessIds)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      (admin as any)
        .from('reviews')
        .select('business_id, rating')
        .in('business_id', businessIds)
        .eq('is_hidden', false),
    ]);

    if (ownersResult.error) throw ownersResult.error;
    if (servicesResult.error) throw servicesResult.error;

    const ownersById = new Map(
      (ownersResult.data ?? []).map((owner: any) => [owner.user_id, owner])
    );
    const servicesByBusiness = new Map<string, any[]>();
    for (const service of servicesResult.data ?? []) {
      const existing = servicesByBusiness.get(service.business_id) ?? [];
      existing.push(service);
      servicesByBusiness.set(service.business_id, existing);
    }

    const ratingsByBusiness = new Map<string, number[]>();
    if (!reviewsResult.error) {
      for (const review of reviewsResult.data ?? []) {
        if (
          typeof review.rating !== 'number' ||
          review.rating < 1 ||
          review.rating > 5
        ) {
          continue;
        }
        const existing = ratingsByBusiness.get(review.business_id) ?? [];
        existing.push(review.rating);
        ratingsByBusiness.set(review.business_id, existing);
      }
    }

    const businesses: MarketplaceBusiness[] = candidates
      .flatMap(candidate => {
        const owner = ownersById.get(candidate.profile_id);
        const services = servicesByBusiness.get(candidate.id) ?? [];
        if (
          !owner ||
          !isPublicBusinessProfileLive(owner) ||
          services.length === 0
        ) {
          return [];
        }

        const ratings = ratingsByBusiness.get(candidate.id) ?? [];
        const rating =
          ratings.length > 0
            ? Math.round(
                (ratings.reduce((sum, value) => sum + value, 0) /
                  ratings.length) *
                  10
              ) / 10
            : null;

        return [
          {
            id: candidate.id,
            name: candidate.business_name,
            slug: candidate.business_slug,
            description: candidate.bio,
            serviceArea: candidate.service_area,
            locationMode: candidate.service_location_mode,
            logoUrl: publicStorageUrl(admin, candidate.logo_path),
            bannerUrl: publicStorageUrl(admin, candidate.banner_path),
            services: services.slice(0, 3).map(service => ({
              id: service.id,
              name: service.name,
              priceCents: service.price_cents,
            })),
            rating,
            reviewCount: ratings.length,
          },
        ];
      })
      .sort((a, b) => {
        if (a.rating === null && b.rating !== null) return 1;
        if (a.rating !== null && b.rating === null) return -1;

        const ratingDifference = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDifference !== 0) return ratingDifference;

        const reviewCountDifference = b.reviewCount - a.reviewCount;
        if (reviewCountDifference !== 0) return reviewCountDifference;

        return a.name.localeCompare(b.name);
      });

    return NextResponse.json(
      {
        success: true,
        location: parsed.display,
        businesses,
      } satisfies MarketplaceSearchResponse,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('[marketplace] search failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to search businesses right now.',
      } satisfies MarketplaceSearchResponse,
      { status: 500 }
    );
  }
}
