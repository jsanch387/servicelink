import { searchMapTilerLocations } from '@/features/location/api/mapTilerGeocoding';

export interface MarketplaceSearchPoint {
  latitude: number;
  longitude: number;
}

/**
 * Resolve a marketplace search string to a lat/lng center.
 * Returns null when MapTiler is unavailable or no result — callers fall back
 * to legacy text matching only.
 */
export async function geocodeMarketplaceSearchPoint(
  locationQuery: string
): Promise<MarketplaceSearchPoint | null> {
  const trimmed = locationQuery.trim();
  if (!trimmed) return null;

  try {
    const locations = await searchMapTilerLocations(trimmed, 'customer-search');
    const best = locations[0];
    if (
      !best ||
      !Number.isFinite(best.latitude) ||
      !Number.isFinite(best.longitude)
    ) {
      return null;
    }
    return { latitude: best.latitude, longitude: best.longitude };
  } catch {
    return null;
  }
}
