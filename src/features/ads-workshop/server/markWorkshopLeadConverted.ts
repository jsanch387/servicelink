import { isValidEmail } from '@/features/auth/utils/validation';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type MarkWorkshopLeadConvertedResult =
  | { ok: true; matched: boolean }
  | { ok: false; error: string; status: number };

export async function markWorkshopLeadConverted(options: {
  email?: string;
  userId?: string;
  leadId?: string;
}): Promise<MarkWorkshopLeadConvertedResult> {
  const leadId = options.leadId?.trim();
  const userId = options.userId?.trim();
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();

  const patch: Record<string, string> = {
    signed_up_at: now,
  };
  if (userId) {
    patch.signed_up_user_id = userId;
  }

  if (leadId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('workshop_leads')
      .update(patch)
      .eq('id', leadId)
      .is('signed_up_at', null)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[workshop/converted] update failed:', error.message);
      return { ok: false, error: 'Could not record signup', status: 500 };
    }

    if (data?.id) {
      return { ok: true, matched: true };
    }
  }

  const trimmed = options.email?.trim() ?? '';
  if (!trimmed || !isValidEmail(trimmed)) {
    return leadId
      ? { ok: true, matched: false }
      : { ok: false, error: 'Valid email is required', status: 400 };
  }

  const emailNormalized = trimmed.toLowerCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('workshop_leads')
    .update(patch)
    .eq('email_normalized', emailNormalized)
    .is('signed_up_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[workshop/converted] update failed:', error.message);
    return { ok: false, error: 'Could not record signup', status: 500 };
  }

  return { ok: true, matched: Boolean(data?.id) };
}
