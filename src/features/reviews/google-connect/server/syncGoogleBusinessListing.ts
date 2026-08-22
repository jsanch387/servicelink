import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { fetchGoogleBusinessLocationPick } from './fetchGoogleBusinessLocations';
import { getGoogleAccessTokenForBusiness } from './getGoogleAccessTokenForBusiness';

export type SyncGoogleBusinessListingResult =
  | {
      ok: true;
      locationTitle: string | null;
      foundLocation: boolean;
    }
  | { ok: false; error: string; status: number };

export async function syncGoogleBusinessListing(
  businessId: string
): Promise<SyncGoogleBusinessListingResult> {
  const token = await getGoogleAccessTokenForBusiness(businessId);
  if (!token.ok) {
    return token;
  }

  const fetched = await fetchGoogleBusinessLocationPick(
    token.context.accessToken
  );
  if (!fetched.ok) {
    return {
      ok: false,
      status:
        fetched.status >= 400 && fetched.status < 600 ? fetched.status : 502,
      error: fetched.error,
    };
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error: saveError } = await admin
    .from('google_business_connections')
    .update({
      google_account_name: fetched.location.googleAccountName,
      google_location_name: fetched.location.googleLocationName,
      google_location_title: fetched.location.googleLocationTitle,
      updated_at: now,
    })
    .eq('id', token.context.connectionId);

  if (saveError) {
    console.error('[reviews:google-connect] listing save failed', saveError);
    return {
      ok: false,
      status: 500,
      error: 'Found the listing but could not save it.',
    };
  }

  return {
    ok: true,
    locationTitle: fetched.location.googleLocationTitle,
    foundLocation: Boolean(fetched.location.googleLocationName),
  };
}
