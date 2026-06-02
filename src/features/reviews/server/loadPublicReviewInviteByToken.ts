import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveReviewTokenHash } from '../utils/resolveReviewTokenHash';

export type PublicReviewInviteContext = {
  inviteId: string;
  businessId: string;
  businessName: string;
  bookingId: string;
  customerId: string | null;
  serviceName: string;
  scheduledDate: string;
  scheduledStartTime: string;
  customerDisplayName: string;
};

export type LoadPublicReviewInviteResult =
  | { ok: true; context: PublicReviewInviteContext }
  | {
      ok: false;
      reason: 'invalid_token' | 'not_found' | 'expired' | 'already_submitted';
    };

export async function loadPublicReviewInviteByToken(
  supabase: SupabaseClient,
  rawToken: string
): Promise<LoadPublicReviewInviteResult> {
  const tokenHash = resolveReviewTokenHash(rawToken);
  if (!tokenHash) {
    return { ok: false, reason: 'invalid_token' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invite, error: inviteError } = await (supabase as any)
    .from('review_invites')
    .select('id, business_id, booking_id, customer_id, status, expires_at')
    .eq('link_token_hash', tokenHash)
    .maybeSingle();

  if (inviteError) {
    console.error('[reviews] loadPublicReviewInvite invite query', inviteError);
    return { ok: false, reason: 'not_found' };
  }

  if (!invite?.id) {
    return { ok: false, reason: 'not_found' };
  }

  const status = String(invite.status ?? '');
  if (status === 'submitted') {
    return { ok: false, reason: 'already_submitted' };
  }
  if (status !== 'pending') {
    return { ok: false, reason: 'not_found' };
  }

  const expiresAt = invite.expires_at
    ? new Date(String(invite.expires_at)).getTime()
    : 0;
  if (!expiresAt || expiresAt <= Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  const businessId = String(invite.business_id ?? '').trim();
  const bookingId = String(invite.booking_id ?? '').trim();
  if (!businessId || !bookingId) {
    return { ok: false, reason: 'not_found' };
  }

  const [{ data: business }, { data: booking }] = await Promise.all([
    supabase
      .from('business_profiles')
      .select('business_name')
      .eq('id', businessId)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('bookings')
      .select(
        'service_name, scheduled_date, start_time, customer_name, customer_id'
      )
      .eq('id', bookingId)
      .maybeSingle(),
  ]);

  if (!booking) {
    return { ok: false, reason: 'not_found' };
  }

  const businessName =
    typeof (business as { business_name?: string } | null)?.business_name ===
    'string'
      ? (business as { business_name: string }).business_name.trim()
      : '';

  const customerDisplayName =
    String(
      (booking as { customer_name?: string }).customer_name ?? ''
    ).trim() || 'Guest';

  return {
    ok: true,
    context: {
      inviteId: String(invite.id),
      businessId,
      businessName: businessName || 'Your provider',
      bookingId,
      customerId:
        (booking as { customer_id?: string | null }).customer_id?.trim() ||
        (invite.customer_id as string | null)?.trim() ||
        null,
      serviceName:
        String(
          (booking as { service_name?: string }).service_name ?? ''
        ).trim() || 'Your service',
      scheduledDate: String(
        (booking as { scheduled_date?: string }).scheduled_date ?? ''
      ),
      scheduledStartTime: String(
        (booking as { start_time?: string }).start_time ?? ''
      ),
      customerDisplayName,
    },
  };
}
