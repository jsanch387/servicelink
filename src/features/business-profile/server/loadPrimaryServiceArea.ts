import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/libs/supabase/client';
import type { PrimaryServiceArea } from '../types/primaryServiceArea';
import { toPublicServiceCoverage } from '../utils/primaryServiceArea';
import {
  buildPublicBookingServiceLocation,
  type PublicBookingServiceLocation,
} from '../utils/publicServiceLocation';

type ServiceAreaClient = SupabaseClient<Database>;

function mapPrimaryServiceArea(row: {
  id: string;
  label: string;
  city: string;
  state_code: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  radius_miles: number;
  place_type: string | null;
  provider_place_id: string | null;
}): PrimaryServiceArea {
  return {
    id: row.id,
    label: row.label,
    city: row.city,
    stateCode: row.state_code,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMiles: row.radius_miles,
    placeType: row.place_type,
    providerPlaceId: row.provider_place_id,
  };
}

export async function loadPrimaryServiceArea(
  supabase: ServiceAreaClient,
  businessProfileId: string
): Promise<PrimaryServiceArea | null> {
  const { data, error } = await supabase
    .from('business_service_areas')
    .select(
      'id, label, city, state_code, postal_code, latitude, longitude, radius_miles, place_type, provider_place_id'
    )
    .eq('business_profile_id', businessProfileId)
    .eq('is_primary', true)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return mapPrimaryServiceArea(data);
}

export async function loadPublicBookingServiceLocation(
  supabase: ServiceAreaClient,
  businessProfileId: string,
  profile: Parameters<typeof buildPublicBookingServiceLocation>[0]
): Promise<PublicBookingServiceLocation> {
  const area = await loadPrimaryServiceArea(supabase, businessProfileId);
  return buildPublicBookingServiceLocation(
    profile,
    area ? toPublicServiceCoverage(area) : null
  );
}
