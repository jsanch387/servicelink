import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import type { BookingAssigneeOption } from '../types/bookingAssignee';
import { formatBookingAssigneeLabel } from '../utils/formatBookingAssigneeLabel';
import { teamInviteDisplayName } from '../utils/teamInviteDisplayName';
import { adminDb } from './adminDb';

function personName(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed.includes('@')) return null;
  return trimmed;
}

function authAccountName(
  user: { user_metadata?: Record<string, unknown> } | null | undefined
): string | null {
  const meta = user?.user_metadata;
  return (
    personName(stringValue(meta?.full_name)) ??
    personName(stringValue(meta?.name))
  );
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

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

  const [{ data: members }, { data: invites }] = await Promise.all([
    db
      .from('business_members')
      .select('user_id, status')
      .eq('business_id', businessId)
      .in('status', [ACTIVE_TEAM_MEMBER_STATUS, 'removed']),
    db
      .from('team_invites')
      .select('email, name, accepted_user_id')
      .eq('business_id', businessId),
  ]);

  const inviteRows = (invites ?? []) as Array<{
    email?: string | null;
    name?: string | null;
    accepted_user_id?: string | null;
  }>;
  const memberRows = (
    (members ?? []) as Array<{
      user_id?: string;
      status?: string;
    }>
  ).flatMap(row => {
    const userId = row.user_id?.trim() ?? '';
    if (!userId || userId === ownerId) return [];
    return [{ userId, status: row.status }];
  });

  const { data: profileRows } = await db
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', [ownerId, ...memberRows.map(row => row.userId)]);
  const profileNames = new Map<string, string>();
  for (const row of (profileRows ?? []) as Array<{
    user_id?: string;
    full_name?: string | null;
  }>) {
    const userId = row.user_id?.trim() ?? '';
    const fullName = personName(row.full_name);
    if (userId && fullName) profileNames.set(userId, fullName);
  }

  const options: BookingAssigneeOption[] = [];
  const ownerUser = await admin.auth.admin.getUserById(ownerId);
  options.push({
    userId: ownerId,
    label: formatBookingAssigneeLabel({
      name: profileNames.get(ownerId) ?? authAccountName(ownerUser.data.user),
      email: ownerUser.data.user?.email,
      kind: 'owner',
    }),
    kind: 'owner',
  });

  for (const row of memberRows) {
    const { data } = await admin.auth.admin.getUserById(row.userId);
    const email = data.user?.email ?? null;
    const kind = row.status === ACTIVE_TEAM_MEMBER_STATUS ? 'member' : 'former';
    options.push({
      userId: row.userId,
      label: formatBookingAssigneeLabel({
        name:
          teamInviteDisplayName(inviteRows, { userId: row.userId, email }) ??
          profileNames.get(row.userId) ??
          authAccountName(data.user),
        email,
        kind,
      }),
      kind,
    });
  }

  return options;
}
