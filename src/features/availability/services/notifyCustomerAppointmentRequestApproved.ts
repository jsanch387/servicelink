/**
 * Customer email and SMS after the business approves an appointment request.
 * Both channels send when both contacts exist. A missing contact is skipped.
 * Failures never roll back the approval.
 */

import { parseStoredBookingJobDetails } from '@/features/availability/booking/utils/parseStoredBookingJobDetails';
import { wallClockHHmm } from '@/features/availability/booking/utils/wallClockHHmm';
import { sendAvailabilityBookingCustomerConfirmationEmail } from '@/features/email';
import type { AvailabilityBookingNotificationPayload } from '@/features/email/availability-booking-notification/types';
import { buildAvailabilityBookingEmailServiceLocation } from '@/features/email/availability-booking-notification/buildAvailabilityBookingEmailServiceLocation';
import {
  buildBookingRequestApprovedSms,
  sendAndRecordSms,
} from '@/features/sms';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from '../booking/dashboard/utils/mapBookingRowToDisplay';
import { rescheduleEmailServiceName } from './notifyCustomerAvailabilityBookingRescheduled';

export const APPOINTMENT_REQUEST_APPROVED_SMS_TYPE = 'booking_request_approved';

export type AppointmentRequestApprovedNotifyResult = {
  email: 'sent' | 'skipped' | 'failed';
  sms: 'sent' | 'skipped' | 'failed';
};

const SMS_SKIP_REASONS = new Set([
  'duplicate',
  'no_phone',
  'sms_opt_out',
  'carrier_opt_out',
  'not_eligible',
  'not_configured',
]);

function confirmationPayload(
  booking: BookingRow,
  startTime: string
): AvailabilityBookingNotificationPayload {
  const jobs = parseStoredBookingJobDetails(booking.job_details);
  const discountCents =
    typeof booking.discount_cents === 'number' ? booking.discount_cents : 0;
  const subtotalCents =
    typeof booking.subtotal_cents === 'number' ? booking.subtotal_cents : null;
  const serviceLocation =
    booking.service_location_type === 'mobile'
      ? buildAvailabilityBookingEmailServiceLocation({
          effectiveType: 'mobile',
          shopAddressLabel: null,
          customerStreet: booking.customer_street_address ?? undefined,
          customerUnit: booking.customer_unit_apt ?? undefined,
          customerCity: booking.customer_city ?? undefined,
          customerState: booking.customer_state ?? undefined,
          customerZip: booking.customer_zip ?? undefined,
        })
      : undefined;

  return {
    customerName: booking.customer_name?.trim() || 'Customer',
    customerEmail: booking.customer_email?.trim() || '',
    customerPhone: booking.customer_phone?.trim() || undefined,
    customerVehicleYear: booking.customer_vehicle_year?.trim() || undefined,
    customerVehicleMake: booking.customer_vehicle_make?.trim() || undefined,
    customerVehicleModel: booking.customer_vehicle_model?.trim() || undefined,
    serviceName: rescheduleEmailServiceName(booking),
    scheduledDate: String(booking.scheduled_date ?? '').trim(),
    startTime,
    durationMinutes: booking.duration_minutes,
    servicePriceCents: booking.service_price_cents ?? undefined,
    selectedAddOns: booking.addon_details ?? [],
    totalPriceCents: subtotalCents ?? booking.service_price_cents ?? undefined,
    ...(discountCents > 0 && booking.discount_label?.trim()
      ? {
          discount: {
            label: booking.discount_label.trim(),
            discountCents,
            estimatedTotalCents: Math.max(
              0,
              (subtotalCents ?? 0) - discountCents
            ),
          },
        }
      : {}),
    customerNotes: booking.customer_notes?.trim() || undefined,
    ...(jobs.length > 0
      ? {
          jobs: jobs.map(job => ({
            serviceName: job.serviceName,
            servicePriceOptionLabel: job.servicePriceOptionLabel ?? undefined,
            servicePriceCents: job.servicePriceCents,
            selectedAddOns: job.selectedAddOns,
            durationMinutes: job.durationMinutes,
            customerVehicleYear: job.vehicle?.year || undefined,
            customerVehicleMake: job.vehicle?.make || undefined,
            customerVehicleModel: job.vehicle?.model || undefined,
            customerPetName: job.pet?.name || undefined,
            customerPetSpecies: job.pet?.species || undefined,
            customerPetBreed: job.pet?.breed || undefined,
            customerPetSize: job.pet?.size || undefined,
          })),
        }
      : {}),
    serviceLocation,
  };
}

export async function notifyCustomerAppointmentRequestApproved(
  supabase: SupabaseClient<Database>,
  booking: BookingRow
): Promise<AppointmentRequestApprovedNotifyResult> {
  const bookingId = String(booking.id ?? '').trim();
  const businessId = String(booking.business_id ?? '').trim();
  const scheduledDate = String(booking.scheduled_date ?? '').trim();
  const startTime = wallClockHHmm(String(booking.start_time ?? ''));

  if (!bookingId || !businessId || !scheduledDate || !startTime) {
    return { email: 'skipped', sms: 'skipped' };
  }

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name, business_slug')
    .eq('id', businessId)
    .maybeSingle();

  const biz = business as {
    business_name?: string | null;
    business_slug?: string | null;
  } | null;
  const businessName =
    biz?.business_name?.trim() || biz?.business_slug?.trim() || 'your provider';
  const payload = confirmationPayload(booking, startTime);

  const sendEmail = async (): Promise<
    AppointmentRequestApprovedNotifyResult['email']
  > => {
    const email = booking.customer_email?.trim() || '';
    if (!email) return 'skipped';
    try {
      const mail = await sendAvailabilityBookingCustomerConfirmationEmail(
        email,
        businessName,
        payload
      );
      if (!mail.sent) {
        console.warn('[booking-request-approved] customer email failed', {
          bookingId,
          reason: mail.error,
        });
        return 'failed';
      }
      return 'sent';
    } catch (e) {
      console.warn('[booking-request-approved] customer email failed', {
        bookingId,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e),
      });
      return 'failed';
    }
  };

  const sendSms = async (): Promise<
    AppointmentRequestApprovedNotifyResult['sms']
  > => {
    const phone = booking.customer_phone?.trim() || '';
    if (!phone) return 'skipped';

    let admin: SupabaseClient<Database>;
    try {
      admin = createSupabaseAdminClient();
    } catch (e) {
      console.warn(
        '[booking-request-approved] sms skipped, admin client unavailable',
        {
          bookingId,
          message: e instanceof Error ? e.message.slice(0, 200) : String(e),
        }
      );
      return 'skipped';
    }

    const sms = await sendAndRecordSms({
      admin,
      businessId,
      bookingId,
      customerId: booking.customer_id,
      type: APPOINTMENT_REQUEST_APPROVED_SMS_TYPE,
      to: phone,
      message: buildBookingRequestApprovedSms({
        businessName,
        scheduledDate,
        startTime,
      }),
      dedupeKey: `${bookingId}:${APPOINTMENT_REQUEST_APPROVED_SMS_TYPE}`,
    });
    if (sms.sent) return 'sent';
    if (SMS_SKIP_REASONS.has(sms.reason)) return 'skipped';
    return 'failed';
  };

  const [email, sms] = await Promise.all([sendEmail(), sendSms()]);
  return { email, sms };
}
