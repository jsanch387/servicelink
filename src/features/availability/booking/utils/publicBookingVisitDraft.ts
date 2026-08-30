/**
 * Resume helpers for public multi-job visit draft (stored on the jobs cart).
 *
 * Customer visit order (low friction):
 * schedule → contact (+ address, same screen) → vehicle → review
 * After “add another”, resume on vehicles when the slot still works.
 */

import { formatServiceDateYmd } from '@/features/marketing/utils/isServiceDateInSaleWindow';
import type { CustomerFormData } from '../types';
import { appointmentFitsSameDay } from './ownerManualBookingJobs';
import { INITIAL_CUSTOMER_FORM_DATA } from './initialFormData';
import type {
  PublicBookingVisitDetailsSubStep,
  PublicBookingVisitDraft,
  PublicBookingVisitFlowStep,
} from './publicBookingJobsCart';
import {
  loadPublicBookingJobsCart,
  savePublicBookingVisitDraftOnCart,
  sumPublicBookingJobsDurationMinutes,
} from './publicBookingJobsCart';

export type {
  PublicBookingVisitDetailsSubStep,
  PublicBookingVisitDraft,
  PublicBookingVisitFlowStep,
} from './publicBookingJobsCart';

export type ResumePublicVisitState = {
  customerData: CustomerFormData;
  selectedDate: Date | null;
  selectedTime: string | null;
  step: PublicBookingVisitFlowStep;
  detailsSubStep: PublicBookingVisitDetailsSubStep;
  customerServiceChoice: 'mobile' | 'shop' | null;
  agreedToNotifications: boolean;
  agreedToPolicy: boolean;
  /** New job duration no longer fits the saved start time on that day. */
  scheduleNeedsRetiming: boolean;
};

export function loadPublicBookingVisitDraft(
  businessSlug: string
): PublicBookingVisitDraft | null {
  return loadPublicBookingJobsCart(businessSlug)?.visitDraft ?? null;
}

export function savePublicBookingVisitDraft(
  businessSlug: string,
  draft: PublicBookingVisitDraft
): boolean {
  return savePublicBookingVisitDraftOnCart(businessSlug, draft);
}

/** Local calendar date from `YYYY-MM-DD` (noon — avoids DST edge cases). */
export function dateFromBookingYmd(ymd: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildPublicBookingVisitDraft(args: {
  customerData: CustomerFormData;
  selectedDate: Date | null;
  selectedTime: string | null;
  step: PublicBookingVisitFlowStep;
  detailsSubStep: PublicBookingVisitDetailsSubStep;
  customerServiceChoice: 'mobile' | 'shop' | null;
  agreedToNotifications: boolean;
  agreedToPolicy: boolean;
}): PublicBookingVisitDraft {
  const selectedDateYmd = args.selectedDate
    ? formatServiceDateYmd(args.selectedDate)
    : null;
  return {
    customerData: { ...args.customerData },
    selectedDateIso: args.selectedDate ? args.selectedDate.toISOString() : null,
    selectedDateYmd,
    selectedTime: args.selectedTime,
    step: args.step,
    detailsSubStep: args.detailsSubStep,
    customerServiceChoice: args.customerServiceChoice,
    agreedToNotifications: args.agreedToNotifications,
    agreedToPolicy: args.agreedToPolicy,
  };
}

function hasContactBasics(customer: CustomerFormData): boolean {
  return (
    customer.fullName.trim().length > 0 && customer.phone.trim().length > 0
  );
}

/**
 * Restore UI after Cancel / finishing “add another”.
 * Fresh visits start on the calendar. Returning with a valid slot skips
 * re-picking date/time and lands on vehicles.
 */
export function resolveResumePublicVisitState(args: {
  draft: PublicBookingVisitDraft | null;
  visitDurationMinutes: number;
  needsInlineLocationStep: boolean;
}): ResumePublicVisitState {
  const { draft, visitDurationMinutes, needsInlineLocationStep } = args;
  const fallbackStep: PublicBookingVisitFlowStep = needsInlineLocationStep
    ? 'location'
    : 'schedule';

  if (!draft) {
    return {
      customerData: { ...INITIAL_CUSTOMER_FORM_DATA },
      selectedDate: null,
      selectedTime: null,
      step: fallbackStep,
      detailsSubStep: 'contact',
      customerServiceChoice: null,
      agreedToNotifications: false,
      agreedToPolicy: false,
      scheduleNeedsRetiming: false,
    };
  }

  const customerData: CustomerFormData = {
    ...INITIAL_CUSTOMER_FORM_DATA,
    ...draft.customerData,
  };

  let selectedDate: Date | null = null;
  if (draft.selectedDateYmd) {
    selectedDate = dateFromBookingYmd(draft.selectedDateYmd);
  }
  if (!selectedDate && draft.selectedDateIso) {
    const parsed = new Date(draft.selectedDateIso);
    if (!Number.isNaN(parsed.getTime())) selectedDate = parsed;
  }

  let selectedTime = draft.selectedTime;
  let scheduleNeedsRetiming = false;
  if (
    selectedTime &&
    !appointmentFitsSameDay(selectedTime, visitDurationMinutes)
  ) {
    selectedTime = null;
    scheduleNeedsRetiming = true;
  }

  const hasSlot = Boolean(selectedDate && selectedTime);

  let step = draft.step;
  let detailsSubStep = draft.detailsSubStep;

  if (scheduleNeedsRetiming) {
    step = 'schedule';
  } else if (hasSlot) {
    if (step === 'location' || step === 'schedule') {
      // Already booked a slot — continue the visit (vehicles after add-another).
      step = 'details';
      detailsSubStep = hasContactBasics(customerData)
        ? 'vehicleNotes'
        : 'contact';
    } else if (step === 'details') {
      detailsSubStep = hasContactBasics(customerData)
        ? 'vehicleNotes'
        : detailsSubStep;
    }
    // review / payment stay as saved
  } else if (step === 'review' || step === 'payment') {
    step = 'schedule';
  } else if (step === 'details' || step === 'location') {
    // No slot yet — calendar first (matches “Date & time” CTA).
    step = fallbackStep;
    detailsSubStep = 'contact';
  } else {
    step = 'schedule';
  }

  return {
    customerData,
    selectedDate,
    selectedTime,
    step,
    detailsSubStep,
    customerServiceChoice: draft.customerServiceChoice,
    agreedToNotifications: draft.agreedToNotifications,
    agreedToPolicy: draft.agreedToPolicy === true,
    scheduleNeedsRetiming,
  };
}

export function currentVisitDurationMinutes(businessSlug: string): number {
  const cart = loadPublicBookingJobsCart(businessSlug);
  if (!cart) return 0;
  return sumPublicBookingJobsDurationMinutes(cart.jobs);
}
