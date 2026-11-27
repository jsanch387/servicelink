import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const REVIEW_REQUEST_DESTINATIONS = ['servicelink', 'google'] as const;

export type ReviewRequestDestination =
  (typeof REVIEW_REQUEST_DESTINATIONS)[number];

export const DEFAULT_REVIEW_REQUEST_DESTINATION: ReviewRequestDestination =
  'servicelink';

export function parseReviewRequestDestination(
  value: unknown
): ReviewRequestDestination {
  if (value === 'google' || value === 'servicelink') return value;
  return DEFAULT_REVIEW_REQUEST_DESTINATION;
}

export async function getReviewRequestDestination(
  businessId: string
): Promise<
  | { ok: true; destination: ReviewRequestDestination }
  | { ok: false; error: string }
> {
  const trimmed = businessId.trim();
  if (!trimmed) {
    return { ok: false, error: 'businessId is required' };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('business_profiles')
    .select('review_request_destination')
    .eq('id', trimmed)
    .maybeSingle();

  if (error) {
    console.error('[reviews] load review_request_destination failed', error);
    return { ok: false, error: 'Could not load review request settings.' };
  }

  const row = data as { review_request_destination?: unknown } | null;
  return {
    ok: true,
    destination: parseReviewRequestDestination(row?.review_request_destination),
  };
}

export async function setReviewRequestDestination(
  businessId: string,
  destination: ReviewRequestDestination
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const trimmed = businessId.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }
  if (
    destination !== 'servicelink' &&
    destination !== 'google'
  ) {
    return {
      ok: false,
      status: 400,
      error: 'reviewRequestDestination must be servicelink or google',
    };
  }

  const admin = createSupabaseAdminClient();

  if (destination === 'google') {
    const { data: connection, error: connectionError } = await admin
      .from('google_business_connections')
      .select('id')
      .eq('business_id', trimmed)
      .maybeSingle();
    if (connectionError) {
      console.error(
        '[reviews] google connection check failed',
        connectionError
      );
      return {
        ok: false,
        status: 500,
        error: 'Could not verify the Google connection.',
      };
    }
    if (!connection) {
      return {
        ok: false,
        status: 400,
        error: 'Connect Google before sending review requests there.',
      };
    }
  }

  const { error } = await admin
    .from('business_profiles')
    .update({
      review_request_destination: destination,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', trimmed);

  if (error) {
    console.error('[reviews] save review_request_destination failed', error);
    return {
      ok: false,
      status: 500,
      error: 'Could not save review request settings.',
    };
  }

  return { ok: true };
}
