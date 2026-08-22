import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { GoogleBusinessTokenResult } from './exchangeGoogleBusinessCode';
import type { GoogleBusinessLocationPick } from './fetchGoogleBusinessLocations';

export async function upsertGoogleBusinessConnection(args: {
  businessId: string;
  tokens: GoogleBusinessTokenResult;
  location: GoogleBusinessLocationPick;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from('google_business_connections').upsert(
    {
      business_id: args.businessId,
      google_account_name: args.location.googleAccountName,
      google_location_name: args.location.googleLocationName,
      google_location_title: args.location.googleLocationTitle,
      refresh_token: args.tokens.refreshToken,
      access_token: args.tokens.accessToken,
      access_token_expires_at: args.tokens.expiresAt,
      scopes: args.tokens.scopes,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: 'business_id' }
  );

  if (error) {
    console.error('[reviews:google-connect] upsert failed', error);
    return { ok: false, error: 'Could not save the Google connection.' };
  }

  return { ok: true };
}
