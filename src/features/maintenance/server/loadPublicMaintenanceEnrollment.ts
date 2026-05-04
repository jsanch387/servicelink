import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';

export type MaintenanceEnrollmentPublicRow = {
  id: string;
  business_id: string;
  customer_id: string;
  status: string;
  payment_status: string;
  service_name_snapshot: string;
  price_cents: number;
  duration_minutes: number;
  frequency_weeks: number;
  anchor_date: string | null;
  anchor_time: string | null;
  owner_payment_mode: string;
  stripe_checkout_session_id: string | null;
};

/**
 * Loads enrollment by raw URL token (hashed like quote links). Returns null if not found or unusable.
 */
export async function loadPublicMaintenanceEnrollmentByToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  rawToken: string
): Promise<MaintenanceEnrollmentPublicRow | null> {
  const tokenHash = resolveQuoteTokenHash(rawToken.trim());
  if (!tokenHash) return null;

  const { data: enrollment, error } = await db
    .from('maintenance_enrollments')
    .select(
      'id, business_id, customer_id, status, payment_status, service_name_snapshot, price_cents, duration_minutes, frequency_weeks, anchor_date, anchor_time, owner_payment_mode, stripe_checkout_session_id'
    )
    .eq('customer_link_token_hash', tokenHash)
    .maybeSingle();

  if (error || !enrollment) return null;

  const status = String(enrollment.status ?? '');
  if (status === 'cancelled' || status === 'visit_completed') return null;

  return enrollment as MaintenanceEnrollmentPublicRow;
}
