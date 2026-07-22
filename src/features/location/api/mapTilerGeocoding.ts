import type {
  LocationAutocompleteMode,
  StructuredLocation,
} from '../types/location';

const MAPTILER_GEOCODING_URL = 'https://api.maptiler.com/geocoding';
const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_SEARCH_CACHE_ENTRIES = 100;

interface SearchCacheEntry {
  locations: StructuredLocation[];
  expiresAt: number;
}

const searchCache = new Map<string, SearchCacheEntry>();

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

interface MapTilerHierarchyItem {
  id: string;
  text: string;
  place_type?: string[];
  short_code?: string;
  properties?: {
    short_code?: string;
    country_code?: string;
  };
}

interface MapTilerFeature extends MapTilerHierarchyItem {
  place_name: string;
  place_type: string[];
  center: [number, number];
  context?: MapTilerHierarchyItem[];
}

interface MapTilerFeatureCollection {
  features?: MapTilerFeature[];
}

function itemType(item: MapTilerHierarchyItem): string {
  return item.place_type?.[0] ?? item.id.split('.')[0] ?? '';
}

function findHierarchyItem(
  feature: MapTilerFeature,
  types: string[]
): MapTilerHierarchyItem | undefined {
  const items: MapTilerHierarchyItem[] = [feature, ...(feature.context ?? [])];
  for (const type of types) {
    const match = items.find(item => itemType(item) === type);
    if (match) return match;
  }
  return undefined;
}

function stateAbbreviation(item?: MapTilerHierarchyItem): string {
  if (!item) return '';
  const shortCode = item.short_code ?? item.properties?.short_code ?? '';
  const codeFromProvider = shortCode.split('-').at(-1)?.toUpperCase() ?? '';
  if (/^[A-Z]{2}$/.test(codeFromProvider)) return codeFromProvider;
  return US_STATE_ABBREVIATIONS[item.text] ?? '';
}

function formatLocationDisplayLabel(
  city: string,
  state: string,
  zip: string
): string {
  const cityState = `${city}, ${state}`;
  return zip ? `${cityState} ${zip}` : cityState;
}

/** User-facing suggestion hint — never show MapTiler jargon like "municipality". */
export function formatLocationSuggestionKind(placeType: string): string {
  switch (placeType) {
    case 'postal_code':
      return 'ZIP code';
    case 'address':
      return 'Address';
    case 'neighborhood':
    case 'neighbourhood':
      return 'Neighborhood';
    case 'place':
    case 'municipality':
    case 'locality':
    case 'municipal_district':
    default:
      return 'City';
  }
}

function mapFeature(feature: MapTilerFeature): StructuredLocation | null {
  const cityItem = findHierarchyItem(feature, [
    'place',
    'municipality',
    'locality',
    'municipal_district',
  ]);
  const regionItem = findHierarchyItem(feature, ['region']);
  const zipItem = findHierarchyItem(feature, ['postal_code']);
  const city = cityItem?.text.trim() ?? '';
  const state = stateAbbreviation(regionItem);
  const zip = zipItem?.text.match(/\b\d{5}\b/)?.[0] ?? '';
  const longitude = feature.center?.[0];
  const latitude = feature.center?.[1];

  if (
    !city ||
    !state ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const displayLabel = formatLocationDisplayLabel(city, state, zip);

  return {
    providerId: feature.id,
    // What the user clicked / what the input should show (not MapTiler place_name).
    label: displayLabel,
    searchValue: displayLabel,
    city,
    state,
    zip,
    latitude,
    longitude,
    placeType: feature.place_type?.[0] ?? itemType(feature),
  };
}

function getMapTilerBrowserKey(): string {
  return process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() || '';
}

export function hasMapTilerBrowserKey(): boolean {
  return Boolean(getMapTilerBrowserKey());
}

function searchCacheKey(query: string, mode: LocationAutocompleteMode): string {
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${mode}:${normalizedQuery}`;
}

function getCachedLocations(key: string): StructuredLocation[] | null {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    searchCache.delete(key);
    return null;
  }

  searchCache.delete(key);
  searchCache.set(key, cached);
  return cached.locations;
}

function cacheLocations(key: string, locations: StructuredLocation[]): void {
  searchCache.set(key, {
    locations,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });

  while (searchCache.size > MAX_SEARCH_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (!oldestKey) break;
    searchCache.delete(oldestKey);
  }
}

async function fetchMapTilerLocations(
  path: string,
  params: URLSearchParams,
  signal?: AbortSignal
): Promise<StructuredLocation[]> {
  const response = await fetch(
    `${MAPTILER_GEOCODING_URL}/${path}.json?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error('Location suggestions are unavailable.');
  }

  const result = (await response.json()) as MapTilerFeatureCollection;
  return (result.features ?? []).flatMap(feature => {
    const location = mapFeature(feature);
    return location ? [location] : [];
  });
}

export async function searchMapTilerLocations(
  query: string,
  mode: LocationAutocompleteMode,
  signal?: AbortSignal
): Promise<StructuredLocation[]> {
  const apiKey = getMapTilerBrowserKey();
  if (!apiKey) throw new Error('MapTiler API key is not configured.');

  const cacheKey = searchCacheKey(query, mode);
  const cachedLocations = getCachedLocations(cacheKey);
  if (cachedLocations) return cachedLocations;

  const params = new URLSearchParams({
    key: apiKey,
    country: 'us',
    language: 'en',
    autocomplete: 'true',
    limit: '5',
    // Prefer city / ZIP centers for service areas (not street addresses).
    types: 'place,municipality,locality,postal_code',
  });
  const locations = await fetchMapTilerLocations(
    encodeURIComponent(query.trim()),
    params,
    signal
  );

  cacheLocations(cacheKey, locations);
  return locations;
}

/** Reverse-geocode coordinates into a city/ZIP search value. */
export async function reverseGeocodeMapTilerLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<StructuredLocation> {
  const apiKey = getMapTilerBrowserKey();
  if (!apiKey) throw new Error('MapTiler API key is not configured.');

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Unable to determine your location.');
  }

  const roundedLat = Math.round(latitude * 1000) / 1000;
  const roundedLng = Math.round(longitude * 1000) / 1000;
  const cacheKey = `reverse:${roundedLat},${roundedLng}`;
  const cachedLocations = getCachedLocations(cacheKey);
  if (cachedLocations?.[0]) return cachedLocations[0];

  const params = new URLSearchParams({
    key: apiKey,
    country: 'us',
    language: 'en',
    limit: '1',
    types: 'postal_code,place,municipality,locality',
  });
  const locations = await fetchMapTilerLocations(
    `${roundedLng},${roundedLat}`,
    params,
    signal
  );
  const location = locations[0];
  if (!location) {
    throw new Error('We could not find a city near your location.');
  }

  cacheLocations(cacheKey, [location]);
  return location;
}
