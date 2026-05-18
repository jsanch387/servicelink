import { isValidEmail } from '@/features/auth/utils/validation';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export type ContactSubmitter = {
  name: string;
  email: string;
};

/**
 * Resolves display name and email for a signed-in contact submission.
 * Name priority: profiles.full_name → user metadata → business name → email local-part.
 */
export async function resolveContactSubmitterFromAuth(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<ContactSubmitter | null> {
  const email = user.email?.trim() ?? '';
  if (!email || !isValidEmail(email)) {
    return null;
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const metaName = [meta?.full_name, meta?.name]
    .find((v): v is string => typeof v === 'string' && v.trim().length > 0)
    ?.trim();

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('business_profiles')
      .select('business_name')
      .eq('profile_id', user.id)
      .maybeSingle(),
  ]);

  const profileName = (
    profile as { full_name?: string | null } | null
  )?.full_name?.trim();
  const businessName = (
    business as { business_name?: string | null } | null
  )?.business_name?.trim();

  const name =
    profileName ||
    metaName ||
    businessName ||
    email.split('@')[0] ||
    'ServiceLink user';

  return { name, email };
}
