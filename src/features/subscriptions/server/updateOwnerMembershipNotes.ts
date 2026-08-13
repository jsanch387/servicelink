import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriber } from '../types/ownerSubscriptionPlan';
import { getOwnerCustomerMembership } from './listOwnerCustomerMemberships';
import { customerMembershipsOf } from './membershipTablesQuery';

const NOTES_MAX = 2000;

export async function updateOwnerMembershipNotes(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    notes: string;
  }
): Promise<
  | { ok: true; subscriber: OwnerSubscriber }
  | { ok: false; error: string; status: number }
> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  if (!businessId || !membershipId) {
    return { ok: false, error: 'Missing id.', status: 400 };
  }

  const notes = args.notes.trim().slice(0, NOTES_MAX);

  // Owner session can SELECT only; verify ownership then write via service role.
  const { data: existing, error: loadErr } = await customerMembershipsOf(
    supabase
  )
    .select('id')
    .eq('id', membershipId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (loadErr) {
    return { ok: false, error: 'Could not save notes.', status: 500 };
  }
  if (!existing) {
    return { ok: false, error: 'Subscriber not found.', status: 404 };
  }

  const admin = createSupabaseAdminClient();
  const { error: updateErr } = await customerMembershipsOf(admin)
    .update({ notes: notes || null })
    .eq('id', membershipId)
    .eq('business_id', businessId);

  if (updateErr) {
    return { ok: false, error: 'Could not save notes.', status: 500 };
  }

  return getOwnerCustomerMembership(supabase, businessId, membershipId);
}
