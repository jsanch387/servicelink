import type {
  CreateBookingJobItem,
  CreateBookingRequest,
} from '@/features/availability/booking/types';
import { PUBLIC_BOOKING_MAX_JOBS } from '@/features/availability/booking/constants/publicBookingJobs';
import {
  appointmentServiceNameSummary,
  parseOwnerManualBookingJobs,
  sumJobDurationMinutes,
  sumJobGrossCents,
} from '@/features/availability/booking/utils/ownerManualBookingJobs';
import type { BookingReferralSource } from '@/features/booking-attribution/constants';
import { normalizeEnteredPromoCode } from '@/features/marketing/server/resolveBookingPromoDiscountSnapshot';

export type BookingCheckoutDraftPayload = CreateBookingRequest & {
  totalPriceCents: number;
  requiredOnlineAmountCents: number;
  paymentMethodSelected: 'pay_now' | 'pay_in_person' | 'none';
  depositType?: 'fixed' | 'percent' | null;
  depositValue?: number | null;
  /** Added server-side from the referral cookie; the webhook persists it. */
  referralSource?: BookingReferralSource | null;
};

/**
 * Whitelist-parses the client checkout `bookingPayload`.
 * Optional flags such as `agreedToPolicy` must be copied through — the route
 * validates policy against this object, not the raw request body.
 */
export function parseBookingCheckoutDraftPayload(
  raw: unknown
): BookingCheckoutDraftPayload | null {
  if (raw == null || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  const customer = payload.customer as Record<string, unknown> | undefined;
  const serviceName =
    typeof payload.serviceName === 'string' ? payload.serviceName.trim() : '';
  const businessSlug =
    typeof payload.businessSlug === 'string' ? payload.businessSlug.trim() : '';
  const businessId =
    typeof payload.businessId === 'string' ? payload.businessId.trim() : '';
  const scheduledDate =
    typeof payload.scheduledDate === 'string'
      ? payload.scheduledDate.trim()
      : '';
  const startTime =
    typeof payload.startTime === 'string' ? payload.startTime.trim() : '';
  const durationMinutesRaw = payload.durationMinutes;
  const durationMinutes =
    typeof durationMinutesRaw === 'number' &&
    Number.isFinite(durationMinutesRaw)
      ? Math.round(durationMinutesRaw)
      : NaN;
  const fullName =
    typeof customer?.fullName === 'string' ? customer.fullName.trim() : '';
  const email =
    typeof customer?.email === 'string' ? customer.email.trim() : '';
  const totalPriceRaw = payload.totalPriceCents;
  const totalPriceCents =
    typeof totalPriceRaw === 'number' && Number.isFinite(totalPriceRaw)
      ? Math.max(0, Math.round(totalPriceRaw))
      : NaN;
  const requiredOnlineRaw = payload.requiredOnlineAmountCents;
  const requiredOnlineAmountCents =
    typeof requiredOnlineRaw === 'number' && Number.isFinite(requiredOnlineRaw)
      ? Math.max(0, Math.round(requiredOnlineRaw))
      : NaN;
  const paymentMethodSelected = payload.paymentMethodSelected;
  const paymentMethod =
    paymentMethodSelected === 'pay_now' ||
    paymentMethodSelected === 'pay_in_person' ||
    paymentMethodSelected === 'none'
      ? paymentMethodSelected
      : 'none';
  const depositTypeRaw = payload.depositType;
  const depositType =
    depositTypeRaw === 'fixed' || depositTypeRaw === 'percent'
      ? depositTypeRaw
      : null;
  const depositValueRaw = payload.depositValue;
  const depositValue =
    typeof depositValueRaw === 'number' && Number.isFinite(depositValueRaw)
      ? Math.max(0, Math.round(depositValueRaw))
      : null;
  const customerServiceLocationRaw = payload.customerServiceLocation;
  const customerServiceLocation =
    customerServiceLocationRaw === 'mobile' ||
    customerServiceLocationRaw === 'shop'
      ? customerServiceLocationRaw
      : undefined;
  const serviceLocationTypeRaw = payload.serviceLocationType;
  const serviceLocationType =
    serviceLocationTypeRaw === 'mobile' || serviceLocationTypeRaw === 'shop'
      ? serviceLocationTypeRaw
      : undefined;
  const promoCodeRaw =
    typeof payload.promoCode === 'string'
      ? normalizeEnteredPromoCode(payload.promoCode)
      : '';

  let jobs: CreateBookingJobItem[] | undefined;
  let resolvedServiceName = serviceName;
  let resolvedDurationMinutes = durationMinutes;
  let resolvedTotalPriceCents = totalPriceCents;

  if (Array.isArray(payload.jobs)) {
    const parsed = parseOwnerManualBookingJobs(payload.jobs);
    if (!parsed.ok) return null;
    if (parsed.jobs.length > PUBLIC_BOOKING_MAX_JOBS) return null;
    if (parsed.jobs.some(j => !j.serviceId)) return null;
    jobs = parsed.jobs.map(j => ({
      serviceId: j.serviceId,
      serviceName: j.serviceName,
      servicePriceOptionLabel: j.servicePriceOptionLabel,
      servicePriceCents: j.servicePriceCents,
      selectedAddOns: j.selectedAddOns,
      durationMinutes: j.durationMinutes,
      vehicle:
        j.vehicle.year || j.vehicle.make || j.vehicle.model
          ? {
              year: j.vehicle.year,
              make: j.vehicle.make,
              model: j.vehicle.model,
            }
          : undefined,
      clientJobId: j.clientJobId,
    }));
    resolvedServiceName = appointmentServiceNameSummary(parsed.jobs);
    resolvedDurationMinutes = sumJobDurationMinutes(parsed.jobs);
    // Prefer client total when present (sale/promo display); else sum jobs.
    if (!Number.isFinite(resolvedTotalPriceCents)) {
      resolvedTotalPriceCents = sumJobGrossCents(parsed.jobs);
    }
  }

  if (
    !businessSlug ||
    !businessId ||
    !resolvedServiceName ||
    !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) ||
    !/^\d{1,2}:\d{2}$/.test(startTime) ||
    !Number.isFinite(resolvedDurationMinutes) ||
    resolvedDurationMinutes < 1 ||
    !fullName ||
    !Number.isFinite(resolvedTotalPriceCents) ||
    !Number.isFinite(requiredOnlineAmountCents)
  ) {
    return null;
  }

  return {
    businessSlug,
    businessId,
    serviceId:
      typeof payload.serviceId === 'string'
        ? payload.serviceId.trim()
        : undefined,
    serviceName: resolvedServiceName,
    servicePriceOptionLabel:
      typeof payload.servicePriceOptionLabel === 'string'
        ? payload.servicePriceOptionLabel.trim()
        : undefined,
    servicePriceCents:
      typeof payload.servicePriceCents === 'number' &&
      Number.isFinite(payload.servicePriceCents)
        ? Math.max(0, Math.round(payload.servicePriceCents))
        : undefined,
    selectedAddOns: Array.isArray(payload.selectedAddOns)
      ? (payload.selectedAddOns as CreateBookingRequest['selectedAddOns'])
      : undefined,
    durationMinutes: resolvedDurationMinutes,
    scheduledDate,
    startTime,
    customer: {
      fullName,
      email,
      phone: typeof customer?.phone === 'string' ? customer.phone : '',
      streetAddress:
        typeof customer?.streetAddress === 'string'
          ? customer.streetAddress
          : '',
      unitApt: typeof customer?.unitApt === 'string' ? customer.unitApt : '',
      city: typeof customer?.city === 'string' ? customer.city : '',
      state: typeof customer?.state === 'string' ? customer.state : '',
      zip: typeof customer?.zip === 'string' ? customer.zip : '',
      vehicleYear:
        typeof customer?.vehicleYear === 'string' ? customer.vehicleYear : '',
      vehicleMake:
        typeof customer?.vehicleMake === 'string' ? customer.vehicleMake : '',
      vehicleModel:
        typeof customer?.vehicleModel === 'string' ? customer.vehicleModel : '',
      petName: typeof customer?.petName === 'string' ? customer.petName : '',
      petSpecies:
        typeof customer?.petSpecies === 'string' ? customer.petSpecies : '',
      petBreed: typeof customer?.petBreed === 'string' ? customer.petBreed : '',
      petSize: typeof customer?.petSize === 'string' ? customer.petSize : '',
      notes: typeof customer?.notes === 'string' ? customer.notes : '',
    },
    totalPriceCents: resolvedTotalPriceCents,
    requiredOnlineAmountCents,
    paymentMethodSelected: paymentMethod,
    depositType,
    depositValue,
    customerServiceLocation,
    serviceLocationType,
    ...(promoCodeRaw ? { promoCode: promoCodeRaw } : {}),
    ...(jobs ? { jobs } : {}),
    ...(payload.agreedToPolicy === true ? { agreedToPolicy: true } : {}),
    ...(payload.agreedToNotifications === false
      ? { agreedToNotifications: false }
      : payload.agreedToNotifications === true
        ? { agreedToNotifications: true }
        : {}),
  };
}
