import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PUBLIC_BOOKING_V2_OWNER_EMAILS,
  isPublicBookingV2OwnerEmail,
} from '../publicBookingV2';

/** True when this business owner is allowed onto the new public booking flow. */
export async function publicBookingV2EnabledForOwner(
  admin: SupabaseClient,
  profileId: string | null | undefined
): Promise<boolean> {
  if (PUBLIC_BOOKING_V2_OWNER_EMAILS.length === 0) {
    return isPublicBookingV2OwnerEmail(null);
  }
  const id = profileId?.trim();
  if (!id) return false;
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data.user) return false;
  return isPublicBookingV2OwnerEmail(data.user.email);
}
