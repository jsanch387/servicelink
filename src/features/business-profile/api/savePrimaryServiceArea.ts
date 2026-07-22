import { API_ROUTES } from '@/constants/routes';
import type { StructuredLocation } from '@/features/location/types/location';

export interface SaveServiceAreaInput {
  label: string;
  city: string;
  stateCode: string;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  placeType?: string | null;
  providerPlaceId?: string | null;
}

export interface SaveServiceAreaResponse {
  success: boolean;
  error?: string;
}

export function buildServiceAreaPayload(
  location: StructuredLocation,
  radiusMiles: number
): SaveServiceAreaInput {
  return {
    label: location.label.trim() || `${location.city}, ${location.state}`,
    city: location.city.trim(),
    stateCode: location.state.trim().toUpperCase().slice(0, 2),
    postalCode: location.zip?.trim() || null,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMiles,
    placeType: location.placeType || null,
    providerPlaceId: location.providerId || null,
  };
}

export async function savePrimaryServiceArea(
  input: SaveServiceAreaInput
): Promise<SaveServiceAreaResponse> {
  const response = await fetch(API_ROUTES.BUSINESS_PROFILE_SERVICE_AREA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  let payload: SaveServiceAreaResponse | null = null;
  try {
    payload = (await response.json()) as SaveServiceAreaResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    return {
      success: false,
      error: payload?.error || 'Unable to save service area.',
    };
  }

  return { success: true };
}
