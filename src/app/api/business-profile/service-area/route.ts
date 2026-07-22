/**
 * POST /api/business-profile/service-area
 * Upsert the owner's primary mobile service coverage area.
 *
 * Auth: web cookies or `Authorization: Bearer <supabase access_token>` (mobile).
 */

import { formatServiceArea } from '@/features/business-profile/utils/businessLocation';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

const MIN_RADIUS = 1;
const MAX_RADIUS = 200;

interface ServiceAreaBody {
  label?: unknown;
  city?: unknown;
  stateCode?: unknown;
  postalCode?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  radiusMiles?: unknown;
  placeType?: unknown;
  providerPlaceId?: unknown;
}

function asTrimmedString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { supabase } = auth;
  const resolved = await resolveCurrentBusinessId(supabase);
  if (!resolved.ok) {
    return NextResponse.json(
      { success: false, error: resolved.error },
      { status: resolved.status }
    );
  }

  let body: ServiceAreaBody;
  try {
    body = (await request.json()) as ServiceAreaBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const city = asTrimmedString(body.city, 100);
  const stateCode = asTrimmedString(body.stateCode, 2)?.toUpperCase() ?? null;
  const label =
    asTrimmedString(body.label, 200) ||
    (city && stateCode ? `${city}, ${stateCode}` : null);
  const postalCodeRaw = asTrimmedString(body.postalCode, 10);
  const postalCode =
    postalCodeRaw && /^\d{5}$/.test(postalCodeRaw) ? postalCodeRaw : null;
  const placeType = asTrimmedString(body.placeType, 50);
  const providerPlaceId = asTrimmedString(body.providerPlaceId, 200);

  const latitude =
    typeof body.latitude === 'number' && Number.isFinite(body.latitude)
      ? body.latitude
      : null;
  const longitude =
    typeof body.longitude === 'number' && Number.isFinite(body.longitude)
      ? body.longitude
      : null;
  const radiusMiles =
    typeof body.radiusMiles === 'number' && Number.isFinite(body.radiusMiles)
      ? Math.round(body.radiusMiles)
      : null;

  if (!city || !stateCode || stateCode.length !== 2) {
    return NextResponse.json(
      { success: false, error: 'Choose a suggested city and state.' },
      { status: 400 }
    );
  }
  if (
    latitude == null ||
    longitude == null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { success: false, error: 'Location coordinates are invalid.' },
      { status: 400 }
    );
  }
  if (
    radiusMiles == null ||
    radiusMiles < MIN_RADIUS ||
    radiusMiles > MAX_RADIUS
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `Travel distance must be between ${MIN_RADIUS} and ${MAX_RADIUS} miles.`,
      },
      { status: 400 }
    );
  }
  if (!label) {
    return NextResponse.json(
      { success: false, error: 'Location label is required.' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const row = {
    business_profile_id: resolved.businessId,
    label,
    city,
    state_code: stateCode,
    postal_code: postalCode,
    country_code: 'US',
    latitude,
    longitude,
    radius_miles: radiusMiles,
    place_type: placeType,
    provider: 'maptiler',
    provider_place_id: providerPlaceId,
    is_primary: true,
    is_active: true,
    verified_at: now,
    updated_at: now,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data: existing, error: existingError } = await client
    .from('business_service_areas')
    .select('id')
    .eq('business_profile_id', resolved.businessId)
    .eq('is_primary', true)
    .maybeSingle();

  if (existingError) {
    console.error('[service-area] lookup failed', existingError);
    return NextResponse.json(
      { success: false, error: 'Unable to save service area right now.' },
      { status: 500 }
    );
  }

  if (existing?.id) {
    const { error: updateError } = await client
      .from('business_service_areas')
      .update(row)
      .eq('id', existing.id);

    if (updateError) {
      console.error('[service-area] update failed', updateError);
      return NextResponse.json(
        { success: false, error: 'Unable to save service area right now.' },
        { status: 500 }
      );
    }
  } else {
    const { error: insertError } = await client
      .from('business_service_areas')
      .insert(row);

    if (insertError) {
      console.error('[service-area] insert failed', insertError);
      return NextResponse.json(
        { success: false, error: 'Unable to save service area right now.' },
        { status: 500 }
      );
    }
  }

  // Keep legacy profile fields in sync for existing city/ZIP search.
  const { error: profileError } = await client
    .from('business_profiles')
    .update({
      service_area: formatServiceArea(city, stateCode),
      business_zip: postalCode,
      updated_at: now,
    })
    .eq('id', resolved.businessId);

  if (profileError) {
    console.error('[service-area] profile sync failed', profileError);
    // Service area row is saved; treat profile sync failure as soft error.
  }

  return NextResponse.json({ success: true });
}
