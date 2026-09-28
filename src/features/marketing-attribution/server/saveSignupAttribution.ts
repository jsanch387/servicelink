import { SIGNUP_ATTRIBUTION_PROFILE_MAX_AGE_MS } from '../constants';
import type { MarketingUtmAttribution } from '../types';
import type { SaveSignupAttributionResult } from '../types';
import { hasSignupAttributionSignal } from '../utils/firstTouchAttribution';
import { isUnknownAttributionPlaceholder } from '../utils/isUnknownAttributionPlaceholder';
import {
  parseMarketingAttributionFromBody,
  toSignupAttributionRow,
} from './parseMarketingAttribution';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

type ProfileCreatedRow = {
  created_at: string | null;
};

type ExistingAttributionRow = {
  user_id: string;
  channel: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  landing_path: string | null;
  referrer: string | null;
};

const EXISTING_ATTRIBUTION_SELECT =
  'user_id, channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid, landing_path, referrer';

async function upgradeUnknownPlaceholder(
  admin: SupabaseClient,
  userId: string,
  attribution: MarketingUtmAttribution
): Promise<SaveSignupAttributionResult> {
  if (!hasSignupAttributionSignal(attribution)) {
    return { ok: true, recorded: false };
  }

  const patch = toSignupAttributionRow(attribution);
  const { data: upgraded, error: updateError } = await admin
    .from('signup_attribution')
    .update(patch as never)
    .eq('user_id', userId)
    .eq('channel', 'unknown')
    .is('utm_source', null)
    .is('fbclid', null)
    .is('gclid', null)
    .select('user_id');

  if (updateError) {
    console.error(
      '[MarketingAttribution] Placeholder upgrade failed:',
      updateError
    );
    return { ok: false, error: 'Failed to save attribution', status: 500 };
  }

  return { ok: true, recorded: Boolean(upgraded?.length) };
}

export async function saveSignupAttribution(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>
): Promise<SaveSignupAttributionResult> {
  const admin = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from('signup_attribution')
    .select(EXISTING_ATTRIBUTION_SELECT)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    console.error(
      '[MarketingAttribution] Existing signup lookup failed:',
      existingError
    );
    return { ok: false, error: 'Failed to save attribution', status: 500 };
  }

  const existingRow = existing as ExistingAttributionRow | null;
  if (existingRow && !isUnknownAttributionPlaceholder(existingRow)) {
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
  if (existingRow) {
    return upgradeUnknownPlaceholder(admin, userId, attribution);
  }

  const row = {
    user_id: userId,
    ...toSignupAttributionRow(attribution),
    signed_up_at: new Date().toISOString(),
  };

  const { error: insertError } = await admin
    .from('signup_attribution')
    // Supabase generated Insert is `never` on this hand-written Database type.
    .insert(row as never);

  if (insertError?.code === '23505') {
    return upgradeUnknownPlaceholder(admin, userId, attribution);
  }

  if (insertError) {
    console.error('[MarketingAttribution] Signup insert failed:', insertError);
    return { ok: false, error: 'Failed to save attribution', status: 500 };
  }

  return { ok: true, recorded: true };
}
