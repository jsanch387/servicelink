/**
 * Shared auth + business resolution for Tap to Pay routes.
 */

import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export type TapToPayRouteAuth =
  | {
      ok: true;
      user: { id: string };
      supabase: SupabaseClient<Database>;
      business: { id: string; business_name: string | null };
    }
  | { ok: false; httpStatus: number; error: string };

export async function resolveTapToPayRouteAuth(
  request: NextRequest
): Promise<TapToPayRouteAuth> {
  const auth = await getAuthenticatedUser(request);
  if ('error' in auth) {
    return { ok: false, httpStatus: auth.status, error: auth.error };
  }

  const { data: businessData, error: businessError } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth.supabase as any)
      .from('business_profiles')
      .select('id, business_name')
      .eq('profile_id', auth.user.id)
      .single();

  const business = businessData as {
    id: string;
    business_name: string | null;
  } | null;

  if (businessError || !business) {
    return {
      ok: false,
      httpStatus: 404,
      error: 'Business profile not found',
    };
  }

  return {
    ok: true,
    user: auth.user,
    supabase: auth.supabase,
    business,
  };
}
