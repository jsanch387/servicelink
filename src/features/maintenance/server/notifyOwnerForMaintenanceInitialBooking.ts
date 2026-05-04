/**
 * Owner in-app notification + "new appointment" email when a maintenance
 * enrollment creates its first calendar booking (same pipeline as V2 bookings).
 */

import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import type { AvailabilityBookingNotificationPayload } from '@/features/email/availability-booking-notification/types';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function notifyOwnerForMaintenanceInitialBooking(
  supabase: SupabaseClient<Database>,
  params: {
    businessId: string;
    bookingId: string;
    serviceName: string;
    scheduledDate: string;
    startTime: string;
    durationMinutes: number;
    priceCents: number;
    paidWithCard: boolean;
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profileRow, error: profileErr } = await supabase
    .from('business_profiles')
    .select('profile_id')
    .eq('id', params.businessId)
    .maybeSingle();

  if (profileErr) {
    console.error(
      '[maintenance] owner notify: business_profiles',
      profileErr,
      params.bookingId
    );
    return;
  }

  const profileId =
    (profileRow as { profile_id?: string | null } | null)?.profile_id ?? null;

  const { data: bookingRow, error: bookingErr } = await db
    .from('bookings')
    .select(
      'customer_name, customer_email, customer_phone, customer_vehicle_year, customer_vehicle_make, customer_vehicle_model'
    )
    .eq('id', params.bookingId)
    .maybeSingle();

  if (bookingErr || !bookingRow) {
    if (bookingErr) {
      console.error(
        '[maintenance] owner notify: load booking',
        bookingErr,
        params.bookingId
      );
    }
    return;
  }

  const br = bookingRow as {
    customer_name?: string | null;
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_vehicle_year?: string | null;
    customer_vehicle_make?: string | null;
    customer_vehicle_model?: string | null;
  };

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.max(0, cents) / 100);

  const priceCents = Math.max(0, Math.round(params.priceCents));

  const paymentSummary: NonNullable<
    AvailabilityBookingNotificationPayload['paymentSummary']
  > = params.paidWithCard
    ? {
        title: 'Payment',
        rows: [
          {
            label: 'Paid in full (card, this visit)',
            value: formatMoney(priceCents),
          },
        ],
        stripeCardPayment: true,
      }
    : priceCents > 0
      ? {
          title: 'Payment',
          rows: [
            { label: 'Visit total', value: formatMoney(priceCents) },
            {
              label: 'Amount due at appointment',
              value: formatMoney(priceCents),
            },
          ],
          note: 'Customer chose pay in person for this maintenance visit.',
        }
      : {
          title: 'Payment',
          rows: [{ label: 'No online charge (this visit)', value: '—' }],
        };

  const customerEmail = String(br.customer_email ?? '').trim();
  const emailPayload: AvailabilityBookingNotificationPayload = {
    customerName: String(br.customer_name ?? '').trim() || 'Customer',
    customerEmail: customerEmail || '(not on file)',
    customerPhone: String(br.customer_phone ?? '').trim() || undefined,
    customerVehicleYear:
      String(br.customer_vehicle_year ?? '').trim() || undefined,
    customerVehicleMake:
      String(br.customer_vehicle_make ?? '').trim() || undefined,
    customerVehicleModel:
      String(br.customer_vehicle_model ?? '').trim() || undefined,
    serviceName: params.serviceName,
    scheduledDate: params.scheduledDate,
    startTime: params.startTime,
    durationMinutes: params.durationMinutes,
    servicePriceCents: priceCents,
    totalPriceCents: priceCents,
    paymentSummary,
  };

  await notifyOwnerForAvailabilityBookingCreated(supabase, {
    profileId,
    bookingId: params.bookingId,
    customerName: emailPayload.customerName,
    serviceSummaryLine: params.serviceName,
    scheduledDate: params.scheduledDate,
    emailPayload,
  });
}
