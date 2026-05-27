/**
 * Step 2 tenant wiring: map Instagram webhook `entry[0].id` → ServiceLink business.
 *
 * Lookup order:
 * 1. `instagram_messaging_channels` (dashboard Connect Instagram)
 * 2. Env fallback (`INSTAGRAM_MESSAGING_BUSINESS_ID`) for manual / legacy wiring
 */

import { instagramMessagingChannelsOf } from '@/features/automation/server/instagramMessagingChannelsQuery';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type InstagramTenant = {
  businessId: string;
  instagramAccountId: string;
  pageAccessToken: string | null;
};

export type ResolveInstagramTenantResult =
  | { ok: true; tenant: InstagramTenant }
  | { ok: false; reason: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readEnvBusinessId(): string | null {
  const id = process.env.INSTAGRAM_MESSAGING_BUSINESS_ID?.trim();
  return id && id.length > 0 ? id : null;
}

function readEnvInstagramAccountId(): string | null {
  const id = process.env.INSTAGRAM_MESSAGING_ACCOUNT_ID?.trim();
  return id && id.length > 0 ? id : null;
}

function readEnvPageAccessToken(): string | null {
  let token = process.env.META_PAGE_ACCESS_TOKEN?.trim() ?? '';
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  return token || null;
}

async function resolveFromDatabase(
  instagramAccountId: string
): Promise<InstagramTenant | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await instagramMessagingChannelsOf(supabase)
      .select('business_id, instagram_account_id, page_access_token')
      .eq('instagram_account_id', instagramAccountId)
      .is('disconnected_at', null)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const token = String(data.page_access_token ?? '').trim();
    if (!token) {
      return null;
    }

    return {
      businessId: data.business_id,
      instagramAccountId: data.instagram_account_id,
      pageAccessToken: token,
    };
  } catch {
    return null;
  }
}

function resolveFromEnv(
  instagramAccountId: string
): ResolveInstagramTenantResult {
  const businessId = readEnvBusinessId();
  if (!businessId) {
    return {
      ok: false,
      reason:
        'No instagram_messaging_channels row and INSTAGRAM_MESSAGING_BUSINESS_ID is not set',
    };
  }

  if (!UUID_RE.test(businessId)) {
    return {
      ok: false,
      reason:
        'INSTAGRAM_MESSAGING_BUSINESS_ID must be a business_profiles.id UUID',
    };
  }

  const expectedAccountId = readEnvInstagramAccountId();
  if (expectedAccountId && expectedAccountId !== instagramAccountId) {
    return {
      ok: false,
      reason: `instagram account id mismatch (webhook=${instagramAccountId}, env=${expectedAccountId})`,
    };
  }

  return {
    ok: true,
    tenant: {
      businessId,
      instagramAccountId,
      pageAccessToken: readEnvPageAccessToken(),
    },
  };
}

/**
 * Resolves which ServiceLink business owns this Instagram inbox.
 */
export async function resolveInstagramTenant(
  webhookInstagramAccountId: string
): Promise<ResolveInstagramTenantResult> {
  const instagramAccountId = webhookInstagramAccountId.trim();
  if (!instagramAccountId) {
    return {
      ok: false,
      reason: 'webhook missing instagram account id (entry[0].id)',
    };
  }

  const fromDb = await resolveFromDatabase(instagramAccountId);
  if (fromDb) {
    return { ok: true, tenant: fromDb };
  }

  return resolveFromEnv(instagramAccountId);
}
