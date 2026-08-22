import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type GoogleBusinessConnectionStatus = {
  connected: boolean;
  locationTitle: string | null;
};

export async function loadGoogleBusinessConnectionStatus(
  businessId: string
): Promise<
  | { ok: true; status: GoogleBusinessConnectionStatus }
  | { ok: false; error: string }
> {
  const trimmed = businessId.trim();
  if (!trimmed) {
    return { ok: false, error: 'businessId is required' };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('google_business_connections')
    .select('id, google_location_title')
    .eq('business_id', trimmed)
    .maybeSingle();

  if (error) {
    console.error('[reviews:google-connect] status load failed', error);
    return { ok: false, error: 'Could not load Google connection.' };
  }

  return {
    ok: true,
    status: {
      connected: Boolean(data?.id),
      locationTitle: data?.google_location_title ?? null,
    },
  };
}
