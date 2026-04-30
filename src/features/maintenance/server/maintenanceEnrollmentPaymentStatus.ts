/**
 * Values persisted on `maintenance_enrollments.payment_status` must match the DB
 * check constraint (e.g. `paid`, not `paid_online`).
 */
export const MAINTENANCE_ENROLLMENT_PAYMENT_PAID_CARD = 'paid' as const;

export function maintenanceEnrollmentPaidWithCard(
  paymentStatus: string | null | undefined
): boolean {
  const s = String(paymentStatus ?? '').trim();
  return s === MAINTENANCE_ENROLLMENT_PAYMENT_PAID_CARD || s === 'paid_online';
}
