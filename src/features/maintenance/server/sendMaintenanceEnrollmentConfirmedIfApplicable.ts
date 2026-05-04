/**
 * After a maintenance enrollment is accepted (card or pay-in-person), emails the
 * customer a confirmation with visit details when they have an email on file.
 */

import { sendMaintenanceEnrollmentConfirmedEmail } from '@/features/email/maintenance-enrollment-confirmed/sendMaintenanceEnrollmentConfirmedEmail';
import type { MaintenanceEnrollmentConfirmedPayload } from '@/features/email/maintenance-enrollment-confirmed/types';
import { hasMaintenanceAnchorScheduled } from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { maintenancePlanServiceLabel } from '@/features/maintenance/utils/maintenancePlanServiceLabel';
import { maintenanceEnrollmentPaidWithCard } from '@/features/maintenance/server/maintenanceEnrollmentPaymentStatus';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Best-effort: loads enrollment by id (must be `accepted` with a real anchor).
 */
export async function sendMaintenanceEnrollmentConfirmedIfApplicable(
  supabase: SupabaseClient<Database>,
  enrollmentId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: row, error } = await db
    .from('maintenance_enrollments')
    .select(
      'id, business_id, customer_id, status, payment_status, customer_selected_payment, service_name_snapshot, price_cents, duration_minutes, frequency_weeks, anchor_date, anchor_time'
    )
    .eq('id', enrollmentId)
    .maybeSingle();

  if (error || !row) {
    if (error) {
      console.error(
        '[maintenance] confirmation email: load enrollment',
        error,
        enrollmentId
      );
    }
    return;
  }

  if (String(row.status ?? '') !== 'accepted') {
    return;
  }

  if (!hasMaintenanceAnchorScheduled(row)) {
    return;
  }

  const customerId = String(row.customer_id ?? '').trim();
  const businessId = String(row.business_id ?? '').trim();
  if (!customerId || !businessId) return;

  const { data: customerRow, error: custErr } = await db
    .from('customers')
    .select('email, email_normalized, full_name')
    .eq('id', customerId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (custErr || !customerRow) {
    if (custErr) {
      console.error(
        '[maintenance] confirmation email: load customer',
        custErr,
        enrollmentId
      );
    }
    return;
  }

  const emailRaw = (
    (customerRow as { email_normalized?: string | null; email?: string | null })
      .email_normalized ??
    (customerRow as { email?: string | null }).email ??
    ''
  ).trim();
  if (!emailRaw) {
    return;
  }

  const { data: bizRow, error: bizErr } = await db
    .from('business_profiles')
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();

  if (bizErr) {
    console.error(
      '[maintenance] confirmation email: load business',
      bizErr,
      enrollmentId
    );
    return;
  }

  const businessName =
    (
      bizRow as { business_name?: string | null } | null
    )?.business_name?.trim() || 'Your detailer';
  const customerName =
    (customerRow as { full_name?: string | null }).full_name?.trim() || 'there';

  const payStatus = String(row.payment_status ?? '').trim();
  const payChoice = String(
    (row as { customer_selected_payment?: string | null })
      .customer_selected_payment ?? ''
  ).trim();
  const paidWithCard = maintenanceEnrollmentPaidWithCard(payStatus);
  const paymentSummary = paidWithCard
    ? 'Paid with card'
    : payStatus === 'pay_in_person' || payChoice === 'in_person'
      ? 'Pay in person at your visit'
      : 'Confirmed';

  const payload: MaintenanceEnrollmentConfirmedPayload = {
    customerName,
    businessName,
    serviceName: maintenancePlanServiceLabel(row.service_name_snapshot),
    priceCents: Math.max(0, Math.round(Number(row.price_cents ?? 0))),
    visitDate: String(row.anchor_date ?? '').trim(),
    visitTime: String(row.anchor_time ?? '')
      .trim()
      .slice(0, 5),
    durationMinutes: Math.max(
      1,
      Math.round(Number(row.duration_minutes ?? 60))
    ),
    frequencyWeeks: Math.max(1, Math.round(Number(row.frequency_weeks ?? 1))),
    paymentSummary,
    paidWithCard,
  };

  const result = await sendMaintenanceEnrollmentConfirmedEmail(
    emailRaw,
    payload
  );
  if (!result.sent) {
    console.warn('[maintenance] confirmation email not sent', {
      enrollmentId,
      error: result.error,
    });
  }
}
