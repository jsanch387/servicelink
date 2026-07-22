/* eslint-disable @typescript-eslint/no-explicit-any */

import { isProAccess } from '@/features/pricing/utils/isProAccess';
import { isPublicBusinessProfileLive } from '@/features/pricing/utils/publicBusinessProfileLive';
import { MEDIA_CONFIG } from '@/features/media/media.types';
import { isMarketplaceListingDeniedByEmail } from '../config/marketplaceListingDenylist';
import type { MarketplaceBusiness } from '../types/marketplace';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { geocodeMarketplaceSearchPoint } from './geocodeMarketplaceSearchPoint';
import { haversineMiles } from './haversineMiles';

const MAX_LOCATION_LENGTH = 100;
const MAX_RESULTS = 50;

export interface ParsedMarketplaceLocation {
  display: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export interface MarketplaceSearchResult {
  location: string;
  businesses: MarketplaceBusiness[];
}

type BusinessProfileRow = {
  id: string;
  profile_id: string;
  business_name: string;
  business_slug: string;
  business_type: string | null;
  service_area: string;
  business_zip: string | null;
  service_location_mode: string | null;
  bio: string | null;
  logo_path: string | null;
  banner_path: string | null;
};

type ServiceAreaRow = {
  business_profile_id: string;
  label: string;
  city: string;
  state_code: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
};

function normalizeWords(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseMarketplaceLocation(
  value: string
): ParsedMarketplaceLocation | null {
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

function matchesLegacyTextLocation(
  candidate: BusinessProfileRow,
  parsed: ParsedMarketplaceLocation
): boolean {
  if (
    !candidate.profile_id?.trim() ||
    !candidate.business_slug?.trim() ||
    !candidate.service_area?.trim()
  ) {
    return false;
  }

  if (parsed.zip && !parsed.city) {
    return candidate.business_zip === parsed.zip;
  }

  if (!parsed.city) return false;
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
}

/** Shared marketplace search for the public API and SSR city pages. */
export async function searchMarketplaceBusinesses(
  locationQuery: string
): Promise<MarketplaceSearchResult> {
  const parsed = parseMarketplaceLocation(locationQuery);
  if (!parsed) {
    throw new Error('Enter a city, state, or five-digit ZIP code.');
  }

  const admin = createSupabaseAdminClient();
  const searchPoint = await geocodeMarketplaceSearchPoint(parsed.display);

  const [legacyResult, serviceAreasResult] = await Promise.all([
    (async () => {
      let query = (admin as any)
        .from('business_profiles')
        .select(
          'id, profile_id, business_name, business_slug, business_type, service_area, business_zip, service_location_mode, bio, logo_path, banner_path'
        )
        .ilike('business_type', '%detail%')
        .not('business_slug', 'is', null)
        .limit(MAX_RESULTS);

      query =
        parsed.zip && !parsed.city
          ? query.eq('business_zip', parsed.zip)
          : query.ilike('service_area', `%${parsed.city}%`);

      return query;
    })(),
    (admin as any)
      .from('business_service_areas')
      .select(
        'business_profile_id, label, city, state_code, latitude, longitude, radius_miles'
      )
      .eq('is_primary', true)
      .eq('is_active', true),
  ]);

  if (legacyResult.error) throw legacyResult.error;
  if (serviceAreasResult.error) throw serviceAreasResult.error;

  const legacyRows = ((legacyResult.data ?? []) as BusinessProfileRow[]).filter(
    row => matchesLegacyTextLocation(row, parsed)
  );

  const serviceAreas = (serviceAreasResult.data ?? []) as ServiceAreaRow[];
  const businessesWithServiceArea = new Set(
    serviceAreas.map(area => area.business_profile_id)
  );

  const distanceByBusinessId = new Map<string, number>();
  const serviceAreaLabelByBusinessId = new Map<string, string>();
  const radiusMatchIds: string[] = [];

  if (searchPoint) {
    for (const area of serviceAreas) {
      if (
        !Number.isFinite(area.latitude) ||
        !Number.isFinite(area.longitude) ||
        !Number.isFinite(area.radius_miles) ||
        area.radius_miles <= 0
      ) {
        continue;
      }

      const miles = haversineMiles(
        searchPoint.latitude,
        searchPoint.longitude,
        area.latitude,
        area.longitude
      );
      if (miles > area.radius_miles) continue;

      radiusMatchIds.push(area.business_profile_id);
      distanceByBusinessId.set(area.business_profile_id, miles);
      serviceAreaLabelByBusinessId.set(
        area.business_profile_id,
        area.label?.trim() ||
          [area.city, area.state_code].filter(Boolean).join(', ')
      );
    }
  }

  // BSA is authoritative when present: radius match only.
  // No BSA yet: keep legacy city/ZIP text match.
  const legacyOnlyRows = searchPoint
    ? legacyRows.filter(row => !businessesWithServiceArea.has(row.id))
    : legacyRows;

  const candidatesById = new Map<string, BusinessProfileRow>();
  for (const row of legacyOnlyRows) {
    candidatesById.set(row.id, row);
  }
  // Radius hits that were already loaded via the legacy query.
  for (const row of legacyRows) {
    if (radiusMatchIds.includes(row.id)) {
      candidatesById.set(row.id, row);
    }
  }

  const radiusIdsNeedingFetch = radiusMatchIds.filter(
    id => !candidatesById.has(id)
  );
  if (radiusIdsNeedingFetch.length > 0) {
    const { data, error } = await (admin as any)
      .from('business_profiles')
      .select(
        'id, profile_id, business_name, business_slug, business_type, service_area, business_zip, service_location_mode, bio, logo_path, banner_path'
      )
      .in('id', radiusIdsNeedingFetch)
      .ilike('business_type', '%detail%')
      .not('business_slug', 'is', null);
    if (error) throw error;
    for (const row of (data ?? []) as BusinessProfileRow[]) {
      if (row.profile_id?.trim() && row.business_slug?.trim()) {
        candidatesById.set(row.id, row);
      }
    }
  }

  const candidates = [...candidatesById.values()].slice(0, MAX_RESULTS);

  if (candidates.length === 0) {
    return { location: parsed.display, businesses: [] };
  }

  const profileIds = candidates
    .map(candidate => candidate.profile_id?.trim())
    .filter(Boolean);
  const businessIds = candidates.map(candidate => candidate.id);

  const [ownersResult, servicesResult, reviewsResult, imagesResult] =
    await Promise.all([
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
      (admin as any)
        .from('business_images')
        .select('business_id, storage_path, position')
        .in('business_id', businessIds)
        .order('position', { ascending: true }),
    ]);

  if (ownersResult.error) throw ownersResult.error;
  if (servicesResult.error) throw servicesResult.error;

  const ownersById = new Map<string, any>(
    (ownersResult.data ?? []).map((owner: any) => [owner.user_id, owner])
  );

  // Auth email (not a business_profiles column) — used for manual denylist.
  const ownerEmailByProfileId = new Map<string, string | null>();
  await Promise.all(
    profileIds.map(async profileId => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(profileId);
        if (error || !data.user) {
          ownerEmailByProfileId.set(profileId, null);
          return;
        }
        ownerEmailByProfileId.set(profileId, data.user.email ?? null);
      } catch {
        ownerEmailByProfileId.set(profileId, null);
      }
    })
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

  const imagesByBusiness = new Map<string, string[]>();
  if (!imagesResult.error) {
    const filled = new Set<string>();
    for (const image of imagesResult.data ?? []) {
      if (filled.size === businessIds.length) break;

      const existing = imagesByBusiness.get(image.business_id) ?? [];
      if (existing.length >= 3) {
        filled.add(image.business_id);
        continue;
      }

      const path = image.storage_path?.trim();
      if (!path) continue;
      const url = publicStorageUrl(admin, path);
      if (!url) continue;

      existing.push(url);
      imagesByBusiness.set(image.business_id, existing);
      if (existing.length >= 3) filled.add(image.business_id);
    }
  }

  const businesses: MarketplaceBusiness[] = candidates
    .flatMap(candidate => {
      if (
        isMarketplaceListingDeniedByEmail(
          ownerEmailByProfileId.get(candidate.profile_id)
        )
      ) {
        return [];
      }

      const owner = ownersById.get(candidate.profile_id);
      const services = servicesByBusiness.get(candidate.id) ?? [];
      if (
        !owner ||
        !isPublicBusinessProfileLive(owner) ||
        !isProAccess(
          owner.subscription_tier,
          owner.subscription_current_period_end,
          owner.subscription_status,
          owner.stripe_subscription_id,
          owner.stripe_customer_id
        ) ||
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

      // Lowest price first so cards' "From $X" is the real starting price.
      const servicesByPrice = [...services].sort(
        (a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0)
      );

      return [
        {
          id: candidate.id,
          name: candidate.business_name,
          slug: candidate.business_slug,
          description: candidate.bio,
          serviceArea:
            serviceAreaLabelByBusinessId.get(candidate.id) ||
            candidate.service_area,
          locationMode: candidate.service_location_mode || 'both',
          logoUrl: publicStorageUrl(admin, candidate.logo_path),
          bannerUrl: publicStorageUrl(admin, candidate.banner_path),
          portfolioUrls: imagesByBusiness.get(candidate.id) ?? [],
          services: servicesByPrice.slice(0, 3).map(service => ({
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
      const distanceA = distanceByBusinessId.get(a.id);
      const distanceB = distanceByBusinessId.get(b.id);
      if (distanceA != null && distanceB != null) {
        const distanceDifference = distanceA - distanceB;
        if (distanceDifference !== 0) return distanceDifference;
      } else if (distanceA != null && distanceB == null) {
        return -1;
      } else if (distanceA == null && distanceB != null) {
        return 1;
      }

      if (a.rating === null && b.rating !== null) return 1;
      if (a.rating !== null && b.rating === null) return -1;

      const ratingDifference = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDifference !== 0) return ratingDifference;

      const reviewCountDifference = b.reviewCount - a.reviewCount;
      if (reviewCountDifference !== 0) return reviewCountDifference;

      return a.name.localeCompare(b.name);
    });

  return { location: parsed.display, businesses };
}
