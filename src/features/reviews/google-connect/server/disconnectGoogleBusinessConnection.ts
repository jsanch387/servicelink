import { DEFAULT_REVIEW_REQUEST_DESTINATION } from '@/features/reviews/server/reviewRequestDestination';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type DisconnectGoogleBusinessConnectionResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

async function revokeGoogleToken(token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) return;
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: trimmed }),
    });
  } catch (error) {
    console.warn('[reviews:google-connect] token revoke failed', error);
  }
}

/**
 * Removes the Google Business connection for a shop and clears imported
 * Google reviews so a wrong listing does not linger after reconnect.
 */
export async function disconnectGoogleBusinessConnection(
  businessId: string
): Promise<DisconnectGoogleBusinessConnectionResult> {
  const trimmed = businessId.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }

  const admin = createSupabaseAdminClient();
  const { data: row, error: loadError } = await admin
    .from('google_business_connections')
    .select('id, refresh_token, access_token')
    .eq('business_id', trimmed)
    .maybeSingle();

  if (loadError) {
    console.error('[reviews:google-connect] disconnect load failed', loadError);
    return {
      ok: false,
      status: 500,
      error: 'Could not load the Google connection.',
    };
  }

  const connection = row as {
    id: string;
    refresh_token: string | null;
    access_token: string | null;
  } | null;

  if (!connection) {
    return { ok: true };
  }

  await revokeGoogleToken(
    connection.refresh_token?.trim() || connection.access_token?.trim() || ''
  );

  const { error: reviewsDeleteError } = await admin
    .from('google_reviews')
    .delete()
    .eq('business_id', trimmed);
  if (reviewsDeleteError) {
    console.error(
      '[reviews:google-connect] disconnect reviews delete failed',
      reviewsDeleteError
    );
    return {
      ok: false,
      status: 500,
      error: 'Could not clear imported Google reviews.',
    };
  }

  const { error: connectionDeleteError } = await admin
    .from('google_business_connections')
    .delete()
    .eq('id', connection.id);
  if (connectionDeleteError) {
    console.error(
      '[reviews:google-connect] disconnect connection delete failed',
      connectionDeleteError
    );
    return {
      ok: false,
      status: 500,
      error: 'Could not disconnect Google.',
    };
  }

  const { error: destinationResetError } = await admin
    .from('business_profiles')
    .update({
      review_request_destination: DEFAULT_REVIEW_REQUEST_DESTINATION,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', trimmed);
  if (destinationResetError) {
    console.error(
      '[reviews:google-connect] disconnect destination reset failed',
      destinationResetError
    );
    return {
      ok: false,
      status: 500,
      error: 'Disconnected Google but could not reset review destination.',
    };
  }

  return { ok: true };
}
