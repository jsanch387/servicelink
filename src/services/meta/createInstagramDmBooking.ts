/**
 * Validates slot + creates a V2 booking from Instagram DM collected state.
 */

import {
  ownerBookingSlotValidationMessage,
  validateOwnerBookingSlot,
} from '@/features/availability/booking/server/validateOwnerBookingSlot';
import type { CustomerFormData } from '@/features/availability/booking/types';
import {
  bookingCustomerPayloadErrorMessage,
  normalizeBookingCustomerInput,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import {
  createBooking,
  insertBookingPaymentsRowForNoCheckoutPublicBooking,
} from '@/features/availability/services/bookingService';
import { enforceFreeTierBookingCapBeforeCreate } from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import {
  formatVehicleLabel,
  hasCompleteCustomer,
  hasCompleteSchedule,
} from '@/services/meta/instagramDmBookingState';
import type { InstagramDmConversation } from '@/services/meta/instagramDmConversation';
import { getPreferredTimeFromNotes } from '@/services/meta/instagramDmConversation';
import type { InstagramBusinessContext } from '@/services/meta/loadInstagramBusinessContext';
import { normalizeInstagramStartTime } from '@/services/meta/normalizeInstagramStartTime';
import { resolveInstagramServiceMatch } from '@/services/meta/resolveInstagramServiceMatch';

export type CreateInstagramDmBookingResult =
  | { ok: true; bookingId: string; customerFacingMessage: string }
  | { ok: false; customerFacingMessage: string };

function buildCustomerFormData(
  conversation: InstagramDmConversation
): CustomerFormData {
  return {
    fullName: conversation.collectedName ?? '',
    email: conversation.collectedEmail ?? '',
    phone: conversation.collectedPhone ?? '',
    streetAddress: conversation.collectedStreet ?? '',
    unitApt: conversation.collectedUnit ?? '',
    city: conversation.collectedCity ?? '',
    state: conversation.collectedState ?? '',
    zip: conversation.collectedZip ?? '',
    vehicleYear: conversation.collectedVehicleYear ?? '',
    vehicleMake: conversation.collectedVehicleMake ?? '',
    vehicleModel: conversation.collectedVehicleModel ?? '',
    notes: 'Booked via Instagram DM',
  };
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function buildBookingSuccessReply(
  context: InstagramBusinessContext,
  conversation: InstagramDmConversation
): string {
  const service = conversation.collectedService ?? 'your appointment';
  const vehicle = formatVehicleLabel(conversation);
  const date = conversation.collectedDate
    ? formatDisplayDate(conversation.collectedDate)
    : 'your scheduled day';
  const time =
    getPreferredTimeFromNotes(conversation.collectedNotes) ?? 'your time';
  const businessName = context.businessName?.trim() || 'We';

  return `You're all set! ${businessName} has you booked for ${service} on ${date} at ${time} for your ${vehicle}. We'll see you then — message here if anything changes.`;
}

export async function createInstagramDmBooking(args: {
  businessContext: InstagramBusinessContext;
  businessSlug: string;
  conversation: InstagramDmConversation;
  requireVehicleFields: boolean;
}): Promise<CreateInstagramDmBookingResult> {
  const { businessContext, businessSlug, conversation, requireVehicleFields } =
    args;

  if (
    !hasCompleteSchedule(conversation, { requireVehicleFields }) ||
    !hasCompleteCustomer(conversation)
  ) {
    return {
      ok: false,
      customerFacingMessage:
        "I'm still missing a detail or two before I can lock you in — I'll ask for what's left.",
    };
  }

  const scheduledDate = conversation.collectedDate!.trim();
  const startTimeRaw = getPreferredTimeFromNotes(conversation.collectedNotes);
  const startTimeHHmm = normalizeInstagramStartTime(startTimeRaw);
  if (!startTimeHHmm) {
    return {
      ok: false,
      customerFacingMessage:
        'What time works best? I want to make sure I have the right start time.',
    };
  }

  const matchedById = conversation.collectedServiceId
    ? businessContext.services.find(
        s => s.id === conversation.collectedServiceId
      )
    : null;
  const serviceMatch =
    matchedById != null
      ? {
          serviceId: matchedById.id,
          serviceName: matchedById.name,
          durationMinutes:
            matchedById.durationMinutes != null &&
            matchedById.durationMinutes > 0
              ? matchedById.durationMinutes
              : 60,
          priceCents: matchedById.basePriceCents,
        }
      : resolveInstagramServiceMatch(
          businessContext,
          conversation.collectedService
        );

  const serviceName =
    serviceMatch?.serviceName ?? conversation.collectedService!.trim();
  const durationMinutes = serviceMatch?.durationMinutes ?? 60;
  const servicePriceCents = serviceMatch?.priceCents ?? null;

  const customer = normalizeBookingCustomerInput(
    buildCustomerFormData(conversation)
  );
  const customerErr = bookingCustomerPayloadErrorMessage(customer);
  if (customerErr) {
    return {
      ok: false,
      customerFacingMessage:
        'I need to double-check your contact info — can you send your full name, phone, and service address again?',
    };
  }

  const supabase = createSupabaseAdminClient();
  const businessId = businessContext.businessId;

  const { data: profile, error: profileError } = await supabase
    .from('business_profiles')
    .select('id, business_slug, business_name, profile_id, free_bookings_count')
    .eq('id', businessId)
    .single();

  if (profileError || !profile) {
    console.error('[instagram-dm-booking] profile load', profileError);
    return {
      ok: false,
      customerFacingMessage:
        "I couldn't finish booking just now — give me a minute and message again, or use our booking link.",
    };
  }

  const p = profile as {
    id: string;
    business_slug: string | null;
    business_name: string | null;
    profile_id: string | null;
    free_bookings_count: number | null;
  };

  const cap = await enforceFreeTierBookingCapBeforeCreate(supabase, {
    id: p.id,
    profile_id: p.profile_id,
    free_bookings_count: p.free_bookings_count,
  });
  if (!cap.ok) {
    return {
      ok: false,
      customerFacingMessage:
        "We're not able to take new online bookings at the moment — please message the shop directly.",
    };
  }

  const slotCheck = await validateOwnerBookingSlot(supabase, {
    businessId,
    scheduledDate,
    startTimeHHmm,
    durationMinutes,
  });

  if (!slotCheck.ok) {
    return {
      ok: false,
      customerFacingMessage: `${ownerBookingSlotValidationMessage(slotCheck.code)} What other day or time works for you?`,
    };
  }

  try {
    const { id: bookingId } = await createBooking(supabase, {
      businessId,
      businessSlug: p.business_slug ?? businessSlug,
      serviceId: serviceMatch?.serviceId ?? undefined,
      serviceName,
      servicePriceCents: servicePriceCents ?? undefined,
      durationMinutes,
      scheduledDate,
      startTime: startTimeHHmm,
      customer,
    });

    const totalPriceCents = servicePriceCents ?? 0;

    try {
      await insertBookingPaymentsRowForNoCheckoutPublicBooking(supabase, {
        bookingId,
        businessId,
        totalAmountCents: totalPriceCents,
        currency: 'usd',
        paymentsEnabled: false,
        checkoutMode: null,
        clientPaymentMethod: 'none',
      });
    } catch (paymentRowErr) {
      console.warn('[instagram-dm-booking] payment row insert', paymentRowErr);
    }

    const businessDisplayName = p.business_name?.trim() || businessSlug;
    const emailPayload: AvailabilityBookingNotificationPayload = {
      customerName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerVehicleYear: customer.vehicleYear || undefined,
      customerVehicleMake: customer.vehicleMake || undefined,
      customerVehicleModel: customer.vehicleModel || undefined,
      serviceName,
      scheduledDate,
      startTime: startTimeHHmm,
      durationMinutes,
      servicePriceCents: servicePriceCents ?? undefined,
      totalPriceCents,
    };

    try {
      await notifyOwnerForAvailabilityBookingCreated(supabase, {
        profileId: p.profile_id,
        bookingId,
        customerName: customer.fullName,
        serviceSummaryLine: serviceName,
        scheduledDate,
        emailPayload,
      });
    } catch (notifyErr) {
      console.warn('[instagram-dm-booking] owner notify', notifyErr);
    }

    if (customer.email.trim()) {
      try {
        await sendAvailabilityBookingCustomerConfirmationEmail(
          customer.email,
          businessDisplayName,
          emailPayload
        );
      } catch (emailErr) {
        console.warn('[instagram-dm-booking] customer email', emailErr);
      }
    }

    return {
      ok: true,
      bookingId,
      customerFacingMessage: buildBookingSuccessReply(
        businessContext,
        conversation
      ),
    };
  } catch (err) {
    console.error('[instagram-dm-booking] createBooking failed', err);
    return {
      ok: false,
      customerFacingMessage:
        "Something went wrong saving your appointment — try again in a minute or use our booking link and we'll get you taken care of.",
    };
  }
}
