import { API_ROUTES, PUBLIC_BOOKING_FLOW_LANG_QUERY } from '@/constants/routes';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { hasAgreedToPublicBookingPolicy } from '@/features/availability/booking/utils/bookingPolicyAgreementMemory';
import { clientBookingTimeZone } from '@/features/availability/booking/utils/clientBookingTimeZone';
import { INITIAL_CUSTOMER_FORM_DATA } from '@/features/availability/booking/utils/initialFormData';
import {
  buildPublicMultiJobBookingBody,
  publicMultiJobCheckoutTotals,
} from '@/features/availability/booking/utils/buildPublicMultiJobBookingBody';
import { publicBookingFlowUserFacingError } from '@/features/availability/booking/utils/publicBookingFlowUserFacingError';
import type { PublicBookingJobDraft } from '@/features/availability/booking/utils/publicBookingJobsCart';
import type { BookingV2Cart, BookingV2CartItem } from '../types';

const STRIPE_MIN_CHARGE_CENTS = 50;

export function bookingV2JobsForCheckout(
  items: BookingV2CartItem[]
): PublicBookingJobDraft[] {
  return items.map((item, index) => {
    const addOnTotal = item.addOns.reduce(
      (sum, addOn) => sum + Math.max(0, addOn.priceCents),
      0
    );
    return {
      localId: `${item.serviceId}-${index}`,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      servicePriceOptionLabel: item.priceOptionLabel,
      servicePriceCents: Math.max(0, item.originalCents - addOnTotal),
      selectedAddOns: item.addOns.map(addOn => ({
        id: addOn.id,
        name: addOn.name,
        priceCents: Math.max(0, addOn.priceCents),
      })),
      durationMinutes: Math.max(1, item.durationMinutes),
      vehicle: {
        year: item.vehicle.year,
        make: item.vehicle.make,
        model: item.vehicle.model,
      },
      pet: item.pet?.name.trim()
        ? {
            name: item.pet.name.trim(),
            species: item.pet.species.trim(),
            breed: item.pet.breed.trim(),
            size: item.pet.size.trim(),
          }
        : undefined,
    };
  });
}

/**
 * Card and deposit payments open the existing Stripe Checkout session.
 * Pay in person, or nothing due now, creates the appointment directly.
 * Returns `redirected` when the browser is leaving for Stripe.
 */
export async function startBookingV2Payment(input: {
  businessId: string;
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  cart: BookingV2Cart;
  /** Price after sale or promo, before tax. */
  priceAfterDiscountCents: number;
  amountDueNowCents: number;
  paymentChoice: 'pay_now' | 'pay_in_person';
  promoCode?: string | null;
  deposit?: { type: 'fixed' | 'percent'; value: number } | null;
  /** Owner approves before the visit is confirmed. Skips Stripe. */
  appointmentRequest?: boolean;
}): Promise<{ ok: true; redirected: boolean } | { ok: false; error: string }> {
  const schedule = input.cart.schedule;
  if (!schedule) {
    return {
      ok: false,
      error: publicBookingFlowUserFacingError(
        null,
        'booking',
        input.bookingFlowLocale
      ),
    };
  }

  const customer = input.cart.customer;
  const jobs = bookingV2JobsForCheckout(input.cart.items);
  const location = input.cart.serviceLocation ?? undefined;
  const agreedToPolicy = hasAgreedToPublicBookingPolicy(input.businessSlug);
  const bookingBody = buildPublicMultiJobBookingBody({
    businessId: input.businessId,
    businessSlug: input.businessSlug,
    jobs,
    scheduledDate: schedule.date,
    startTime: schedule.time,
    timeZone: clientBookingTimeZone(),
    customer: {
      ...INITIAL_CUSTOMER_FORM_DATA,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      streetAddress: customer.streetAddress,
      unitApt: customer.unitApt,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      notes: customer.notes,
    },
    customerServiceLocation: location,
    paymentMethodSelected: input.appointmentRequest
      ? 'none'
      : input.paymentChoice === 'pay_in_person'
        ? 'pay_in_person'
        : 'pay_now',
    promoCode: input.appointmentRequest
      ? undefined
      : input.promoCode?.trim() || undefined,
    agreedToNotifications: true,
    agreedToPolicy,
  });

  const chargeCents = Math.round(input.amountDueNowCents);
  const visitTotals = publicMultiJobCheckoutTotals(jobs);
  if (
    !input.appointmentRequest &&
    chargeCents > 0 &&
    chargeCents < STRIPE_MIN_CHARGE_CENTS
  ) {
    return {
      ok: false,
      error: publicBookingFlowUserFacingError(
        'Invalid payment amount. Please refresh and try again.',
        'checkout',
        input.bookingFlowLocale
      ),
    };
  }
  if (!input.appointmentRequest && chargeCents >= STRIPE_MIN_CHARGE_CENTS) {
    const checkoutPayload = {
      ...bookingBody,
      serviceName: visitTotals.serviceName,
      durationMinutes: visitTotals.durationMinutes,
      totalPriceCents: Math.max(0, Math.round(input.priceAfterDiscountCents)),
      requiredOnlineAmountCents: chargeCents,
      paymentMethodSelected: bookingBody.paymentMethodSelected,
      depositType: input.deposit?.type ?? null,
      depositValue: input.deposit?.value ?? null,
    };
    const resume = new URLSearchParams();
    if (input.bookingFlowLocale === 'es') {
      resume.set(PUBLIC_BOOKING_FLOW_LANG_QUERY, 'es');
    }
    try {
      const res = await fetch(API_ROUTES.PUBLIC_BOOKING_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: input.businessSlug,
          amountCents: chargeCents,
          serviceName: checkoutPayload.serviceName,
          bookingPayload: checkoutPayload,
          checkoutFlow: 'v2',
          resumeQuery: resume.toString(),
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || json.success === false || !json.url?.trim()) {
        return {
          ok: false,
          error: publicBookingFlowUserFacingError(
            json.error,
            'checkout',
            input.bookingFlowLocale
          ),
        };
      }
      window.location.assign(json.url);
      return { ok: true, redirected: true };
    } catch {
      return {
        ok: false,
        error: publicBookingFlowUserFacingError(
          null,
          'checkout',
          input.bookingFlowLocale
        ),
      };
    }
  }

  try {
    const res = await fetch('/api/public/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bookingBody,
        paymentMethodSelected: input.appointmentRequest
          ? 'none'
          : input.paymentChoice === 'pay_in_person'
            ? 'pay_in_person'
            : 'none',
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: publicBookingFlowUserFacingError(
          json.error,
          'booking',
          input.bookingFlowLocale
        ),
      };
    }
    return { ok: true, redirected: false };
  } catch {
    return {
      ok: false,
      error: publicBookingFlowUserFacingError(
        null,
        'booking',
        input.bookingFlowLocale
      ),
    };
  }
}
