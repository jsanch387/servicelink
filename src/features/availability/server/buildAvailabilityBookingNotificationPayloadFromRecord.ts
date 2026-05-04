import type { AvailabilityBookingNotificationPayload } from '@/features/email';
import type { AddOnForEmail } from '@/features/email/availability-booking-notification/types';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPaymentSummaryForAvailabilityBookingEmail } from './buildPaymentSummaryForAvailabilityBookingEmail';
import { splitStoredAvailabilityServiceName } from './splitStoredAvailabilityServiceName';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type BookingPaymentRow = {
  payment_status: string | null;
  currency: string | null;
  total_amount_cents: number | null;
  paid_online_amount_cents: number | null;
  remaining_amount_cents: number | null;
};

function mapAddonDetails(raw: unknown): AddOnForEmail[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: AddOnForEmail[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : null;
    const name = typeof o.name === 'string' ? o.name : null;
    const priceCents =
      typeof o.priceCents === 'number'
        ? o.priceCents
        : typeof o.price_cents === 'number'
          ? o.price_cents
          : null;
    if (id && name && priceCents != null) {
      out.push({ id, name, priceCents });
    }
  }
  return out;
}

function buildStripeCardPaymentSummary(params: {
  paymentRow: BookingPaymentRow;
  totalPriceCentsForEmail: number;
  hasPriceLineItems: boolean;
}): NonNullable<AvailabilityBookingNotificationPayload['paymentSummary']> {
  const { paymentRow, totalPriceCentsForEmail, hasPriceLineItems } = params;
  const currencyCode =
    typeof paymentRow.currency === 'string' && paymentRow.currency.trim()
      ? paymentRow.currency.trim().toLowerCase()
      : 'usd';
  const formatMoney = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(cents / 100);

  const amountPaidCents = Math.max(0, paymentRow.paid_online_amount_cents ?? 0);
  const remainingCents = Math.max(0, paymentRow.remaining_amount_cents ?? 0);
  const paymentStatus = (paymentRow.payment_status ?? '').trim();

  const depositPaymentRows: Array<{ label: string; value: string }> = [
    { label: 'Deposit paid', value: formatMoney(amountPaidCents) },
    { label: 'Remaining balance', value: formatMoney(remainingCents) },
  ];
  if (!hasPriceLineItems) {
    depositPaymentRows.push({
      label: 'Appointment total',
      value: formatMoney(totalPriceCentsForEmail),
    });
  }

  return {
    title: 'Payment',
    rows:
      paymentStatus === 'paid_full'
        ? [{ label: 'Paid in full', value: formatMoney(amountPaidCents) }]
        : depositPaymentRows,
    stripeCardPayment: true,
  };
}

async function loadBookingPaymentWithRetry(
  supabase: SupabaseClient<Database>,
  bookingId: string
): Promise<BookingPaymentRow | null> {
  const attempts = 12;
  const delayMs = 200;

  for (let i = 0; i < attempts; i += 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('booking_payments')
      .select(
        'payment_status, currency, total_amount_cents, paid_online_amount_cents, remaining_amount_cents'
      )
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (!error && data) {
      return data as BookingPaymentRow;
    }
    if (i < attempts - 1) {
      await sleep(delayMs);
    }
  }
  return null;
}

export type BookingsWebhookRecord = {
  id: string;
  business_id: string;
  service_name: string;
  service_price_cents: number | null;
  addon_details: unknown;
  duration_minutes: number;
  scheduled_date: string;
  start_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_vehicle_year: string | null;
  customer_vehicle_make: string | null;
  customer_vehicle_model: string | null;
  /** When true, customer confirmation email is omitted (e.g. quote approval). */
  suppress_customer_booking_confirmation?: boolean | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseBookingsWebhookRecord(
  record: unknown
): BookingsWebhookRecord | null {
  if (!isRecord(record)) {
    return null;
  }
  const id = typeof record.id === 'string' ? record.id : null;
  const business_id =
    typeof record.business_id === 'string' ? record.business_id : null;
  const service_name =
    typeof record.service_name === 'string' ? record.service_name : null;
  const duration_minutes =
    typeof record.duration_minutes === 'number'
      ? record.duration_minutes
      : null;
  const scheduled_date =
    typeof record.scheduled_date === 'string' ? record.scheduled_date : null;
  const start_time =
    typeof record.start_time === 'string' ? record.start_time : null;
  const customer_name =
    typeof record.customer_name === 'string' ? record.customer_name : null;
  const customer_email =
    typeof record.customer_email === 'string' ? record.customer_email : null;

  if (
    !id ||
    !business_id ||
    !service_name ||
    duration_minutes == null ||
    duration_minutes < 1 ||
    !scheduled_date ||
    !start_time ||
    !customer_name?.trim() ||
    !customer_email?.trim()
  ) {
    return null;
  }

  const service_price_cents =
    typeof record.service_price_cents === 'number'
      ? record.service_price_cents
      : null;

  const suppressRaw = record.suppress_customer_booking_confirmation;
  const suppress =
    suppressRaw === true || suppressRaw === 'true' || suppressRaw === 1;

  return {
    id,
    business_id,
    service_name,
    service_price_cents,
    addon_details: record.addon_details,
    duration_minutes,
    scheduled_date,
    start_time,
    customer_name: customer_name.trim(),
    customer_email: customer_email.trim(),
    customer_phone:
      typeof record.customer_phone === 'string' ? record.customer_phone : null,
    customer_vehicle_year:
      typeof record.customer_vehicle_year === 'string'
        ? record.customer_vehicle_year
        : null,
    customer_vehicle_make:
      typeof record.customer_vehicle_make === 'string'
        ? record.customer_vehicle_make
        : null,
    customer_vehicle_model:
      typeof record.customer_vehicle_model === 'string'
        ? record.customer_vehicle_model
        : null,
    suppress_customer_booking_confirmation: suppress,
  };
}

export async function buildAvailabilityBookingNotificationPayloadFromRecord(
  supabase: SupabaseClient<Database>,
  record: BookingsWebhookRecord
): Promise<{
  emailPayload: AvailabilityBookingNotificationPayload;
  profileId: string | null;
  businessDisplayName: string;
  serviceSummaryLine: string;
} | null> {
  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select('profile_id, business_name, business_slug')
    .eq('id', record.business_id)
    .maybeSingle();

  if (businessError || !businessRow) {
    console.error(
      '[buildAvailabilityBookingNotificationPayloadFromRecord] business_profiles',
      businessError
    );
    return null;
  }

  const bp = businessRow as {
    profile_id?: string | null;
    business_name?: string | null;
    business_slug?: string | null;
  };
  const profileId = bp.profile_id ?? null;
  const businessSlug = bp.business_slug?.trim() ?? '';
  const businessDisplayName =
    bp.business_name?.trim() || businessSlug || 'Your provider';

  const { data: paymentSettingsRow, error: paymentSettingsError } =
    await paymentSettingsOf(supabase)
      .select('payments_enabled, checkout_mode, currency')
      .eq('business_id', record.business_id)
      .maybeSingle();

  if (paymentSettingsError) {
    console.error(
      '[buildAvailabilityBookingNotificationPayloadFromRecord] payment_settings',
      paymentSettingsError
    );
  }

  const paySettings = paymentSettingsRow as {
    payments_enabled?: boolean;
    checkout_mode?: string | null;
    currency?: string | null;
  } | null;

  const selectedAddOns = mapAddonDetails(record.addon_details);
  const basePrice =
    typeof record.service_price_cents === 'number'
      ? record.service_price_cents
      : 0;
  const addOnTotal = selectedAddOns.reduce((s, a) => s + a.priceCents, 0);
  const totalPriceCentsForEmail = basePrice + addOnTotal;
  const hasPriceLineItems =
    (typeof record.service_price_cents === 'number' &&
      record.service_price_cents > 0) ||
    selectedAddOns.length > 0;

  const paymentRow = await loadBookingPaymentWithRetry(supabase, record.id);

  const paymentSummary =
    paymentRow &&
    (paymentRow.paid_online_amount_cents ?? 0) > 0 &&
    (paymentRow.payment_status === 'paid_full' ||
      paymentRow.payment_status === 'deposit_paid')
      ? buildStripeCardPaymentSummary({
          paymentRow,
          totalPriceCentsForEmail,
          hasPriceLineItems,
        })
      : buildPaymentSummaryForAvailabilityBookingEmail({
          paymentsEnabled: paySettings?.payments_enabled === true,
          checkoutMode: paySettings?.checkout_mode,
          currency: paySettings?.currency?.trim() || 'usd',
          totalPriceCents: totalPriceCentsForEmail,
          hasPriceLineItems,
        });

  const { serviceName, servicePriceOptionLabel } =
    splitStoredAvailabilityServiceName(record.service_name);

  const startTime = quoteStartTimeToHHmm(record.start_time);

  const emailPayload: AvailabilityBookingNotificationPayload = {
    customerName: record.customer_name,
    customerEmail: record.customer_email,
    customerPhone: record.customer_phone?.trim() || undefined,
    customerVehicleYear: record.customer_vehicle_year?.trim() || undefined,
    customerVehicleMake: record.customer_vehicle_make?.trim() || undefined,
    customerVehicleModel: record.customer_vehicle_model?.trim() || undefined,
    serviceName,
    servicePriceOptionLabel,
    scheduledDate: record.scheduled_date,
    startTime,
    durationMinutes: record.duration_minutes,
    servicePriceCents:
      typeof record.service_price_cents === 'number'
        ? record.service_price_cents
        : undefined,
    selectedAddOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
    totalPriceCents: totalPriceCentsForEmail,
    paymentSummary,
  };

  return {
    emailPayload,
    profileId,
    businessDisplayName,
    serviceSummaryLine: record.service_name.trim(),
  };
}
