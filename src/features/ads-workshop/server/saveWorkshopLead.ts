import { isValidEmail } from '@/features/auth/utils/validation';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

import type { WorkshopUtmAttribution } from '../types/workshopLead';
import { toWorkshopLeadAttributionRow } from './parseWorkshopAttribution';

export type SaveWorkshopLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string; status: number };

async function fetchLeadIdByEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  emailNormalized: string
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('workshop_leads')
    .select('id')
    .eq('email_normalized', emailNormalized)
    .maybeSingle();

  if (error || !data?.id) return null;
  return String(data.id);
}

export async function saveWorkshopLead(
  email: string,
  attribution?: WorkshopUtmAttribution
): Promise<SaveWorkshopLeadResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, error: 'Email is required', status: 400 };
  }
  if (!isValidEmail(trimmed)) {
    return { ok: false, error: 'Enter a valid email address', status: 400 };
  }

  const emailNormalized = trimmed.toLowerCase();
  const admin = createSupabaseAdminClient();
  const attributionRow = toWorkshopLeadAttributionRow(attribution);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('workshop_leads')
    .insert({
      email: trimmed,
      email_normalized: emailNormalized,
      ...attributionRow,
    })
    .select('id')
    .maybeSingle();

  if (!error && data?.id) {
    return { ok: true, leadId: String(data.id) };
  }

  if (error?.code === '23505') {
    const existingId = await fetchLeadIdByEmail(admin, emailNormalized);
    if (!existingId) {
      return {
        ok: false,
        error: 'Could not save your email. Please try again.',
        status: 500,
      };
    }

    // First-touch UTMs: do not overwrite if already set on returning lead.
    if (attribution && Object.values(attribution).some(Boolean)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (admin as any)
        .from('workshop_leads')
        .select(
          'utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid'
        )
        .eq('id', existingId)
        .maybeSingle();

      const patch: Record<string, string | null> = {};
      if (!existing?.utm_source && attributionRow.utm_source) {
        patch.utm_source = attributionRow.utm_source;
      }
      if (!existing?.utm_medium && attributionRow.utm_medium) {
        patch.utm_medium = attributionRow.utm_medium;
      }
      if (!existing?.utm_campaign && attributionRow.utm_campaign) {
        patch.utm_campaign = attributionRow.utm_campaign;
      }
      if (!existing?.utm_content && attributionRow.utm_content) {
        patch.utm_content = attributionRow.utm_content;
      }
      if (!existing?.utm_term && attributionRow.utm_term) {
        patch.utm_term = attributionRow.utm_term;
      }
      if (!existing?.fbclid && attributionRow.fbclid) {
        patch.fbclid = attributionRow.fbclid;
      }

      if (Object.keys(patch).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)

          .from('workshop_leads')
          .update(patch)
          .eq('id', existingId);
      }
    }

    return { ok: true, leadId: existingId };
  }

  console.error('[workshop/register] insert failed:', error?.message);
  return {
    ok: false,
    error: 'Could not save your email. Please try again.',
    status: 500,
  };
}
