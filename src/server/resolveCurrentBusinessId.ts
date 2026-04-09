import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type ResolveBusinessIdResult =
  | { ok: true; businessId: string }
  | { ok: false; error: string; status: number };

export async function resolveCurrentBusinessId(
  supabase: SupabaseClient<Database>
): Promise<ResolveBusinessIdResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Authentication required', status: 401 };
  }

  const {
    data: businessProfile,
    error: businessError,
  }: {
    data: { id: string } | null;
    error: unknown;
  } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (businessError || !businessProfile) {
    return { ok: false, error: 'Business profile not found', status: 404 };
  }

  return { ok: true, businessId: businessProfile.id };
}
