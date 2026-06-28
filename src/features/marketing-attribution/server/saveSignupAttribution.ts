import { SIGNUP_ATTRIBUTION_PROFILE_MAX_AGE_MS } from '../constants';
import {
  parseMarketingAttributionFromBody,
  toSignupAttributionRow,
} from './parseMarketingAttribution';
import type { SaveSignupAttributionResult } from '../types';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

type ProfileCreatedRow = {
  created_at: string | null;
};

export async function saveSignupAttribution(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>
): Promise<SaveSignupAttributionResult> {
  const admin = createSupabaseAdminClient();

  const { data: existing, error: existingError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('signup_attribution')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

  if (existingError) {
    console.error(
      '[MarketingAttribution] Existing signup lookup failed:',
      existingError
    );
    return { ok: false, error: 'Failed to save attribution', status: 500 };
  }

  if (existing) {
    return { ok: true, recorded: false };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError || !profileRow) {
    return { ok: false, error: 'Profile not found', status: 404 };
  }

  const createdAt = (profileRow as ProfileCreatedRow).created_at;
  if (!createdAt) {
    return { ok: false, error: 'Profile not found', status: 404 };
  }

  const profileAgeMs = Date.now() - new Date(createdAt).getTime();
  if (profileAgeMs > SIGNUP_ATTRIBUTION_PROFILE_MAX_AGE_MS) {
    return { ok: true, recorded: false };
  }

  const attribution = parseMarketingAttributionFromBody(body);
  const row = {
    user_id: userId,
    ...toSignupAttributionRow(attribution),
    signed_up_at: new Date().toISOString(),
  };

  const { error: insertError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('signup_attribution').insert(row);

  if (insertError) {
    console.error('[MarketingAttribution] Signup insert failed:', insertError);
    return { ok: false, error: 'Failed to save attribution', status: 500 };
  }

  return { ok: true, recorded: true };
}
