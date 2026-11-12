import type { SupabaseClient } from '@supabase/supabase-js';
import { isPublicBookingV2OwnerEmail } from '../publicBookingV2';

/** True when this business owner is allowed onto the new public booking flow. */
export async function publicBookingV2EnabledForOwner(
  admin: SupabaseClient,
  profileId: string | null | undefined
): Promise<boolean> {
  const id = profileId?.trim();
  if (!id) return false;
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data.user) return false;
  return isPublicBookingV2OwnerEmail(data.user.email);
}
