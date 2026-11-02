/**
 * Server-side signup row so attribution exists even when the browser never
 * POSTs. Channel is `unknown`. Does not apply the 48h UTM gate and does not
 * overwrite a row the browser already saved.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { toSignupAttributionRow } from './parseMarketingAttribution';

export type EnsureSignupAttributionPlaceholderResult = {
  inserted: boolean;
  skippedReason?: string;
};

export async function ensureSignupAttributionPlaceholder(
  admin: SupabaseClient,
  userId: string
): Promise<EnsureSignupAttributionPlaceholderResult> {
  const id = userId.trim();
  if (!id) {
    return { inserted: false, skippedReason: 'no_user_id' };
  }

  const { data: existing, error: existingError } = await admin
    .from('signup_attribution')
    .select('user_id')
    .eq('user_id', id)
    .maybeSingle();

  if (existingError) {
    console.error(
      '[MarketingAttribution] Placeholder lookup failed:',
      existingError
    );
    return { inserted: false, skippedReason: 'lookup_failed' };
  }
  if (existing) {
    return { inserted: false, skippedReason: 'already_exists' };
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    return { inserted: false, skippedReason: 'no_profile' };
  }

  const createdAt =
    typeof (profile as { created_at?: string | null }).created_at === 'string'
      ? (profile as { created_at: string }).created_at
      : '';
  if (!createdAt) {
    return { inserted: false, skippedReason: 'no_profile' };
  }

  const { error: insertError } = await admin.from('signup_attribution').insert({
    user_id: id,
    ...toSignupAttributionRow(undefined),
    signed_up_at: createdAt,
  } as never);

  if (insertError) {
    if (insertError.code === '23505') {
      return { inserted: false, skippedReason: 'already_exists' };
    }
    console.error(
      '[MarketingAttribution] Placeholder insert failed:',
      insertError
    );
    return { inserted: false, skippedReason: 'insert_failed' };
  }

  return { inserted: true };
}
