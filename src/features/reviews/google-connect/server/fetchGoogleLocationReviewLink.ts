import { fetchGoogleBusinessLocationPick } from './fetchGoogleBusinessLocations';
import { getGoogleAccessTokenForBusiness } from './getGoogleAccessTokenForBusiness';

export type GoogleLocationReviewLink = {
  reviewUrl: string | null;
  placeId: string | null;
  mapsUri: string | null;
  locationName: string | null;
};

type LocationMetadataJson = {
  metadata?: {
    newReviewUri?: string | null;
    placeId?: string | null;
    mapsUri?: string | null;
  } | null;
};

function locationResourcePath(locationName: string): string | null {
  const trimmed = locationName.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('locations/')) return trimmed;
  const fromFull = trimmed.match(/locations\/[^/]+$/);
  if (fromFull) return fromFull[0];
  return `locations/${trimmed}`;
}

function reviewUrlFromMetadata(
  metadata: LocationMetadataJson['metadata']
): string | null {
  const newReviewUri =
    typeof metadata?.newReviewUri === 'string'
      ? metadata.newReviewUri.trim()
      : '';
  if (newReviewUri) return newReviewUri;

  const placeId =
    typeof metadata?.placeId === 'string' ? metadata.placeId.trim() : '';
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  }
  return null;
}

/**
 * Live-fetches the connected listing's Google "leave a review" URL
 * (`metadata.newReviewUri`, with placeId fallback). Preview / product use.
 */
export async function fetchGoogleLocationReviewLink(
  businessId: string
): Promise<
  | { ok: true; link: GoogleLocationReviewLink }
  | { ok: false; status: number; error: string }
> {
  const token = await getGoogleAccessTokenForBusiness(businessId);
  if (!token.ok) {
    return token;
  }

  let storedLocationName = token.context.googleLocationName ?? '';
  if (!storedLocationName.trim()) {
    const picked = await fetchGoogleBusinessLocationPick(
      token.context.accessToken
    );
    if (picked.ok && picked.location.googleLocationName) {
      storedLocationName = picked.location.googleLocationName;
    }
  }

  const locationPath = locationResourcePath(storedLocationName);
  if (!locationPath) {
    return {
      ok: true,
      link: {
        reviewUrl: null,
        placeId: null,
        mapsUri: null,
        locationName: null,
      },
    };
  }

  try {
    const url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationPath}`
    );
    url.searchParams.set('readMask', 'name,title,metadata');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token.context.accessToken}` },
    });

    if (!response.ok) {
      console.warn('[reviews:google-connect] location metadata failed', {
        status: response.status,
        locationPath,
      });
      return {
        ok: false,
        status: response.status >= 400 && response.status < 600
          ? response.status
          : 502,
        error: 'Google could not return the listing review link.',
      };
    }

    const json = (await response.json().catch(() => null)) as
      | LocationMetadataJson
      | null;
    const metadata = json?.metadata ?? null;
    const placeId =
      typeof metadata?.placeId === 'string' && metadata.placeId.trim()
        ? metadata.placeId.trim()
        : null;
    const mapsUri =
      typeof metadata?.mapsUri === 'string' && metadata.mapsUri.trim()
        ? metadata.mapsUri.trim()
        : null;

    return {
      ok: true,
      link: {
        reviewUrl: reviewUrlFromMetadata(metadata),
        placeId,
        mapsUri,
        locationName: locationPath,
      },
    };
  } catch (error) {
    console.warn('[reviews:google-connect] location metadata error', error);
    return {
      ok: false,
      status: 500,
      error: 'Could not reach Google for the review link.',
    };
  }
}
