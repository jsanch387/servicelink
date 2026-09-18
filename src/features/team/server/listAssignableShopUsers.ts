import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import type { BookingAssigneeOption } from '../types/bookingAssignee';
import { formatBookingAssigneeLabel } from '../utils/formatBookingAssigneeLabel';
import { adminDb } from './adminDb';

/** Owner first, then active teammates. Pending invites are not assignable. */
export async function listAssignableShopUsers(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<BookingAssigneeOption[]> {
  const db = adminDb(admin);
  const { data: shop, error: shopError } = await db
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId)
    .maybeSingle();

  const ownerId =
    typeof shop?.profile_id === 'string' ? shop.profile_id.trim() : '';
  if (shopError || !ownerId) {
    return [];
  }

  const { data: members } = await db
    .from('business_members')
    .select('user_id, status')
    .eq('business_id', businessId)
    .in('status', [ACTIVE_TEAM_MEMBER_STATUS, 'removed']);

  const options: BookingAssigneeOption[] = [];
  const ownerUser = await admin.auth.admin.getUserById(ownerId);
  options.push({
    userId: ownerId,
    label: formatBookingAssigneeLabel(ownerUser.data.user?.email, 'owner'),
    kind: 'owner',
  });

  for (const row of (members ?? []) as Array<{
    user_id?: string;
    status?: string;
  }>) {
    const userId = row.user_id?.trim();
    if (!userId || userId === ownerId) continue;
    const { data } = await admin.auth.admin.getUserById(userId);
    const kind = row.status === ACTIVE_TEAM_MEMBER_STATUS ? 'member' : 'former';
    options.push({
      userId,
      label: formatBookingAssigneeLabel(data.user?.email, kind),
      kind,
    });
  }

  return options;
}
