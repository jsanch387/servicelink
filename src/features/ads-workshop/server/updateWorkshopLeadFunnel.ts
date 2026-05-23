import { createSupabaseAdminClient } from '@/libs/supabase/admin';

import type { WorkshopFunnelEvent } from '../types/workshopLead';

export type UpdateWorkshopLeadFunnelResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function updateWorkshopLeadFunnel(
  leadId: string,
  event: WorkshopFunnelEvent
): Promise<UpdateWorkshopLeadFunnelResult> {
  const id = leadId.trim();
  if (!id) {
    return { ok: false, error: 'Lead id is required', status: 400 };
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  if (event === 'video_view') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (admin as any)
      .from('workshop_leads')
      .select('video_view_count, video_first_viewed_at')
      .eq('id', id)
      .maybeSingle();

    if (!row) {
      return { ok: false, error: 'Lead not found', status: 404 };
    }

    const count = Number(row.video_view_count ?? 0) + 1;
    const patch: Record<string, string | number> = {
      video_view_count: count,
    };
    if (!row.video_first_viewed_at) {
      patch.video_first_viewed_at = now;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('workshop_leads')
      .update(patch)
      .eq('id', id);

    if (error) {
      console.error('[workshop/track] video_view failed:', error.message);
      return { ok: false, error: 'Could not record event', status: 500 };
    }

    return { ok: true };
  }

  // signup_click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (admin as any)
    .from('workshop_leads')
    .select('signup_click_count, signup_first_clicked_at')
    .eq('id', id)
    .maybeSingle();

  if (!row) {
    return { ok: false, error: 'Lead not found', status: 404 };
  }

  const count = Number(row.signup_click_count ?? 0) + 1;
  const patch: Record<string, string | number> = {
    signup_click_count: count,
  };
  if (!row.signup_first_clicked_at) {
    patch.signup_first_clicked_at = now;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('workshop_leads')
    .update(patch)
    .eq('id', id);

  if (error) {
    console.error('[workshop/track] signup_click failed:', error.message);
    return { ok: false, error: 'Could not record event', status: 500 };
  }

  return { ok: true };
}
