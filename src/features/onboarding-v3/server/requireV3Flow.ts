import type { SupabaseClient } from '@supabase/supabase-js';

export async function requireV3Flow(
  supabase: SupabaseClient,
  profileId: string
): Promise<
  | { ok: true; status: string }
  | { ok: false; error: string; statusCode: number }
> {
  const { data: rows, error } = await supabase
    .from('profiles')
    .select('onboarding_flow, onboarding_status')
    .eq('user_id', profileId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    return { ok: false, error: error.message, statusCode: 500 };
  }

  const profile = rows?.[0];
  if (!profile || profile.onboarding_flow !== 'v3') {
    return {
      ok: false,
      error: 'This setup is for new accounts.',
      statusCode: 403,
    };
  }

  return { ok: true, status: profile.onboarding_status ?? 'not_started' };
}
