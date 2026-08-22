'use client';

import {
  Button,
  toast,
  useScrollWindowToTopOnChange,
} from '@/components/shared';
import {
  API_ROUTES,
  ROUTES,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import {
  PublicFlowBackNavLabel,
  PublicFlowStickyBackHeader,
  publicFlowBackNavClassName,
} from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePublicBlockedSlots } from '../hooks/usePublicBlockedSlots';
import type {
  AddOnDisplay,
  AvailabilityBookingPageProps,
  CustomerFormData,
  PublicBookingPaymentSettings,
} from '../types';
import {
  clearBookingCheckoutResumeDraft,
  loadBookingCheckoutResumeDraft,
  saveBookingCheckoutResumeDraft,
} from '../utils/bookingCheckoutResumeStorage';
import {
  buildPublicMultiJobBookingBody,
  publicMultiJobCheckoutTotals,
} from '../utils/buildPublicMultiJobBookingBody';
import {
  loadPublicBookingJobsCart,
  persistPublicBookingJobsCartJobs,
  publicBookingJobDisplayName,
  sumPublicBookingJobsDurationMinutes,
  sumPublicBookingJobsGrossCents,
  type PublicBookingJobDraft,
} from '../utils/publicBookingJobsCart';
import {
  buildPublicBookingVisitDraft,
  resolveResumePublicVisitState,
  savePublicBookingVisitDraft,
} from '../utils/publicBookingVisitDraft';
import { PUBLIC_BOOKING_MAX_JOBS } from '../constants/publicBookingJobs';
import { formatBookingWallTime } from '../utils/formatBookingWallTime';
import { INITIAL_CUSTOMER_FORM_DATA } from '../utils/initialFormData';
import { publicBookingFlowUserFacingError } from '../utils/publicBookingFlowUserFacingError';
import { BookingPaymentSuccess } from './BookingPaymentSuccess';
import { BookingPriceBreakdown } from './BookingPriceBreakdown';
import {
  BookingPromoCodeField,
  type AppliedBookingPromo,
} from './BookingPromoCodeField';
import { BookingSuccess } from './BookingSuccess';
import { BookingSummary } from './BookingSummary';
import { PublicMultiJobReviewSummary } from './PublicMultiJobReviewSummary';
import { CustomerForm } from './CustomerForm';
import { BookingVehicleFields } from './BookingVehicleFields';
import { BookingServiceLocationChoice } from './BookingServiceLocationSteps';
import { AddAnotherJobCard } from '../create-appointment/components/AddAnotherJobCard';
import {
  type BookingDetailsSubStep,
  type CustomerServiceChoice,
  clearCustomerServiceAddress,
  customerAddressEntryRequired,
  customerBookingUsesShop,
  getNextDetailsSubStep,
  getPrevDetailsSubStep,
  isBookingDetailsSubStepValid,
  isCustomerServiceLocationChoiceValid,
  prefillCustomerWithShopAddress,
  resolveCustomerServiceLocationPayload,
} from '../utils/bookingServiceLocationFlow';
import { DEFAULT_PUBLIC_BOOKING_SERVICE_LOCATION } from '@/features/business-profile/utils/publicServiceLocation';
import { BookingSaleAppliesNotice } from '@/features/marketing/components/BookingSaleAppliesNotice';
import { computeBookingSalePricing } from '@/features/marketing/utils/computeBookingSalePricing';
import { formatPublicSaleDiscountLabel } from '@/features/marketing/utils/formatPublicSaleDiscountLabel';
import { formatServiceDateYmd } from '@/features/marketing/utils/isServiceDateInSaleWindow';
import { DateSelector } from './DateSelector';
import { TimeSlotGrid } from './TimeSlotGrid';
import { QuickScheduleCard } from './QuickScheduleCard';
import {
  PublicBookingStepTracker,
  type PublicBookingTrackerStage,
} from './PublicBookingStepTracker';
import {
  findEarliestAvailableSlot,
  generateTimeSlots,
} from '../utils/slotGeneration';
import { appointmentFitsSameDay } from '../utils/ownerManualBookingJobs';
import {
  areVisitJobVehiclesComplete,
  firstIncompleteVisitJob,
} from '../utils/visitJobVehicles';
import {
  areVisitJobPetsComplete,
  firstIncompleteVisitPetJob,
  jobPetDraft,
} from '../utils/visitJobPets';
import { BookingPetFields } from './BookingPetFields';

const CUSTOMER_FORM_ID = 'availability-booking-details-form';

const BOOKING_CHECKOUT_RESUME_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Sub-steps inside `/book` after service options/add-ons (location → calendar → form → review). */
export type CalendarBookingStep =
  | 'location'
  | 'schedule'
  | 'details'
  | 'review'
  | 'payment';

type PaymentChoice = 'pay_now' | 'pay_in_person';

function formatPrice(
  cents: number,
  currency: string,
  locale: PublicBookingFlowLocale
): string {
  const amount = Number.isFinite(cents) ? Math.max(0, cents) : 0;
  const safeCurrency = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat(bcp47ForBookingLocale(locale), {
    style: 'currency',
    currency: safeCurrency,
  }).format(amount / 100);
}

function getDepositDueNowCents(
  paymentSettings: PublicBookingPaymentSettings,
  totalPriceCents: number
): number {
  if (!paymentSettings.depositsEnabled) return totalPriceCents;
  if (paymentSettings.depositType === 'fixed') {
    return Math.min(totalPriceCents, Math.max(0, paymentSettings.depositValue));
  }
  const percent = Math.min(100, Math.max(0, paymentSettings.depositValue));
  return Math.round((totalPriceCents * percent) / 100);
}

/** Card amount due now (full pay path vs deposit path). Single source for CTA + checkout. */
function computeOnlineAmountDueNowCents(
  paymentSettings: PublicBookingPaymentSettings | null | undefined,
  paymentSettingsEnabled: boolean,
  customerPaymentChoice: PaymentChoice | null,
  totalPriceCents: number
): number {
  if (!paymentSettingsEnabled || !paymentSettings) return 0;
  const safeTotal = Number.isFinite(totalPriceCents)
    ? Math.max(0, totalPriceCents)
    : 0;
  const configuredDeposit = getDepositDueNowCents(paymentSettings, safeTotal);
  const requiresDepositNow =
    paymentSettings.depositsEnabled === true && configuredDeposit > 0;
  const requiresPayNow =
    paymentSettings.checkoutMode === 'in_app' ||
    (paymentSettings.checkoutMode === 'customer_choice' &&
      customerPaymentChoice === 'pay_now');
  if (requiresPayNow) return safeTotal;
  if (requiresDepositNow) return configuredDeposit;
  return 0;
}

/** Frontend checkout debug logs disabled in production/local builds (server logs only). */
function logBookingCheckoutDev(
  _message: string,
  _payload?: Record<string, unknown>
): void {
  // no-op intentionally
}

/** Same check-circle pattern as `PaymentsCheckoutOptionsCard` (owner dashboard). */
function BookingPaymentOptionButton({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`
        w-full cursor-pointer rounded-xl border px-4 py-3.5 text-left transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dashboard-bg,#0f0f0f)]
        ${
          selected
            ? 'border-emerald-400/40 bg-emerald-500/[0.07] shadow-[0_0_0_1px_rgba(52,211,153,0.12)]'
            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]'
        }
      `}
    >
      <div className="flex gap-3.5 items-start">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          aria-hidden
        >
          {selected ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          ) : (
            <span className="h-6 w-6 rounded-full border-2 border-white/20 bg-transparent" />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <span className="block text-sm font-semibold text-white">
            {title}
          </span>
          <span className="mt-1 block text-xs text-gray-400 leading-relaxed">
            {description}
          </span>
        </div>
      </div>
    </button>
  );
}

export function AvailabilityBookingPage({
  businessName,
  businessId,
  businessSlug,
  showVehicleFields = false,
  showPetFields = false,
  serviceId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addOnIds,
  selectedAddOns: selectedAddOnsProp,
  serviceName,
  serviceDurationMinutes = 60,
  initialCustomerNotes,
  servicePriceCents,
  selectedPriceOptionLabel,
  weeklySchedule,
  timeOffBlocks: timeOffBlocksProp = [],
  minimumNotice = 'none',
  existingBookings: existingBookingsProp,
  isOwnerManualBooking = false,
  paymentSettings = null,
  exitCalendarFlowHref,
  exitCalendarFlowLabel,
  stripeCheckoutSessionId = null,
  bookingFlowLocale = 'en',
  serviceLocation = DEFAULT_PUBLIC_BOOKING_SERVICE_LOCATION,
  initialCustomerServiceChoice = null,
  activeSale = null,
  bookingJobs: bookingJobsProp,
  addAnotherJobHref,
  onRemoveBookingJob,
  onBookingJobsChange,
  onPublicMultiJobBookingCreated,
}: AvailabilityBookingPageProps) {
  const ui = useMemo(
    () => publicBookingUi(bookingFlowLocale),
    [bookingFlowLocale]
  );
  const isMultiJobVisit =
    Array.isArray(bookingJobsProp) && bookingJobsProp.length >= 1;
  const [visitJobs, setVisitJobs] = useState<PublicBookingJobDraft[]>(
    () => bookingJobsProp ?? []
  );
  useEffect(() => {
    if (bookingJobsProp) setVisitJobs(bookingJobsProp);
  }, [bookingJobsProp]);

  const updateVisitJobs = (next: PublicBookingJobDraft[]) => {
    setVisitJobs(next);
    onBookingJobsChange?.(next);
    persistPublicBookingJobsCartJobs(businessSlug, next);
  };

  const backToContactLabel = isOwnerManualBooking
    ? ui.nav.backToCustomerDetails
    : ui.nav.backToYourDetails;
  const needsInlineLocationStep =
    serviceLocation.mode === 'both' &&
    initialCustomerServiceChoice !== 'mobile' &&
    initialCustomerServiceChoice !== 'shop';
  const { blockedSlots } = usePublicBlockedSlots(businessSlug);
  const existingBookings = existingBookingsProp ?? blockedSlots;
  const effectiveMinimumNotice = isOwnerManualBooking ? 'none' : minimumNotice;

  // Use server-resolved add-ons when provided; otherwise fall back to empty (addOnIds alone can't resolve without a fetch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedAddOns: AddOnDisplay[] = selectedAddOnsProp ?? [];

  const totalPriceCents = useMemo(() => {
    if (isMultiJobVisit) {
      return sumPublicBookingJobsGrossCents(visitJobs);
    }
    const base = Number(servicePriceCents);
    const safeBase = Number.isFinite(base) ? Math.max(0, base) : 0;
    const addOnTotal = selectedAddOns.reduce((sum, a) => {
      const p = Number(a.priceCents);
      return sum + (Number.isFinite(p) ? p : 0);
    }, 0);
    const t = safeBase + addOnTotal;
    return Number.isFinite(t) ? t : 0;
  }, [isMultiJobVisit, visitJobs, servicePriceCents, selectedAddOns]);

  const totalBookingDurationMinutes = useMemo(() => {
    if (isMultiJobVisit) {
      return sumPublicBookingJobsDurationMinutes(visitJobs);
    }
    const addOnMins = selectedAddOns.reduce((sum, a) => {
      const m = a.durationMinutes;
      return sum + (m != null && m > 0 ? m : 0);
    }, 0);
    return serviceDurationMinutes + addOnMins;
  }, [isMultiJobVisit, visitJobs, serviceDurationMinutes, selectedAddOns]);

  const displayServiceName = isMultiJobVisit
    ? visitJobs.length > 1
      ? ui.multiJob.visitSummary(visitJobs.length)
      : publicBookingJobDisplayName(visitJobs[0])
    : serviceName;

  // Multi-job: vehicles live on each job, not the customer form.
  const effectiveShowVehicleFields = showVehicleFields && !isMultiJobVisit;
  const effectiveShowPetFields = showPetFields && !isMultiJobVisit;

  // Hydrate once on client mount (visit page only mounts after cart load).
  const multiJobBoot = useMemo(() => {
    if (!isMultiJobVisit) return null;
    return resolveResumePublicVisitState({
      draft: loadPublicBookingJobsCart(businessSlug)?.visitDraft ?? null,
      visitDurationMinutes: sumPublicBookingJobsDurationMinutes(
        bookingJobsProp ?? []
      ),
      needsInlineLocationStep,
    });
    // Intentionally once — resume is sessionStorage snapshot at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState<CalendarBookingStep>(() => {
    if (multiJobBoot) return multiJobBoot.step;
    // Customer path: calendar first (matches service-details “Date & time” CTA).
    return needsInlineLocationStep ? 'location' : 'schedule';
  });
  const [detailsSubStep, setDetailsSubStep] = useState<BookingDetailsSubStep>(
    () => multiJobBoot?.detailsSubStep ?? 'contact'
  );
  const [customerServiceChoice, setCustomerServiceChoice] =
    useState<CustomerServiceChoice>(() => {
      if (
        multiJobBoot?.customerServiceChoice === 'mobile' ||
        multiJobBoot?.customerServiceChoice === 'shop'
      ) {
        return multiJobBoot.customerServiceChoice;
      }
      return serviceLocation.mode === 'both' &&
        (initialCustomerServiceChoice === 'mobile' ||
          initialCustomerServiceChoice === 'shop')
        ? initialCustomerServiceChoice
        : null;
    });
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    () => multiJobBoot?.selectedDate ?? null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    () => multiJobBoot?.selectedTime ?? null
  );
  const timeSlotsSectionRef = useRef<HTMLDivElement | null>(null);
  const visitDraftRestoredRef = useRef(Boolean(multiJobBoot));
  const [scheduleNeedsRetiming, setScheduleNeedsRetiming] = useState(
    () => multiJobBoot?.scheduleNeedsRetiming ?? false
  );
  /**
   * Quick-pick ("first available, let's take it") is collapsed behind the
   * full calendar once the customer asks for a different date/time, or when
   * a re-time notice needs the full picker visible.
   */
  const [showFullCalendar, setShowFullCalendar] = useState(
    () => multiJobBoot?.scheduleNeedsRetiming ?? false
  );
  const [customerData, setCustomerData] = useState<CustomerFormData>(() => {
    if (multiJobBoot) {
      return {
        ...multiJobBoot.customerData,
        ...(initialCustomerNotes?.trim() &&
        !multiJobBoot.customerData.notes.trim()
          ? { notes: initialCustomerNotes.trim() }
          : {}),
      };
    }
    return initialCustomerNotes?.trim()
      ? { ...INITIAL_CUSTOMER_FORM_DATA, notes: initialCustomerNotes.trim() }
      : INITIAL_CUSTOMER_FORM_DATA;
  });
  /** Public customers: transactional SMS opt-in (default on; user may uncheck). */
  const [agreedToPublicNotifications, setAgreedToPublicNotifications] =
    useState(() => multiJobBoot?.agreedToNotifications ?? true);
  const router = useRouter();

  // Restore contact/address/schedule after Cancel or finishing “add another”
  // when boot hydration was skipped (e.g. rare SSR path).
  useEffect(() => {
    if (!isMultiJobVisit || visitDraftRestoredRef.current) return;
    visitDraftRestoredRef.current = true;
    const resumed = resolveResumePublicVisitState({
      draft: loadPublicBookingJobsCart(businessSlug)?.visitDraft ?? null,
      visitDurationMinutes: sumPublicBookingJobsDurationMinutes(visitJobs),
      needsInlineLocationStep,
    });
    setCustomerData(prev => ({
      ...prev,
      ...resumed.customerData,
      ...(initialCustomerNotes?.trim() && !resumed.customerData.notes.trim()
        ? { notes: initialCustomerNotes.trim() }
        : {}),
    }));
    setSelectedDate(resumed.selectedDate);
    setSelectedTime(resumed.selectedTime);
    setStep(resumed.step);
    setDetailsSubStep(resumed.detailsSubStep);
    if (resumed.customerServiceChoice) {
      setCustomerServiceChoice(resumed.customerServiceChoice);
    }
    setAgreedToPublicNotifications(resumed.agreedToNotifications);
    setScheduleNeedsRetiming(resumed.scheduleNeedsRetiming);
  }, [
    isMultiJobVisit,
    businessSlug,
    visitJobs,
    needsInlineLocationStep,
    initialCustomerNotes,
  ]);

  const persistVisitDraft = (overrides?: {
    step?: CalendarBookingStep;
    detailsSubStep?: BookingDetailsSubStep;
    selectedDate?: Date | null;
    selectedTime?: string | null;
  }) => {
    if (!isMultiJobVisit) return;
    savePublicBookingVisitDraft(
      businessSlug,
      buildPublicBookingVisitDraft({
        customerData,
        selectedDate:
          overrides && 'selectedDate' in overrides
            ? (overrides.selectedDate ?? null)
            : selectedDate,
        selectedTime:
          overrides && 'selectedTime' in overrides
            ? (overrides.selectedTime ?? null)
            : selectedTime,
        step: overrides?.step ?? step,
        detailsSubStep: overrides?.detailsSubStep ?? detailsSubStep,
        customerServiceChoice,
        agreedToNotifications: agreedToPublicNotifications,
      })
    );
  };

  const persistVisitDraftAndAddAnother = () => {
    if (!addAnotherJobHref) return;
    // Always resume on vehicles after adding another service (owner job-2+ path).
    persistVisitDraft({ step: 'details', detailsSubStep: 'vehicleNotes' });
    router.push(addAnotherJobHref);
  };

  const removeVisitJob = (localId: string) => {
    if (visitJobs.length <= 1) return;
    if (onRemoveBookingJob) {
      onRemoveBookingJob(localId);
    } else {
      updateVisitJobs(visitJobs.filter(j => j.localId !== localId));
    }
  };

  /**
   * Only re-validate the chosen slot when the visit actually got LONGER
   * (add-another) since we last confirmed it fits — not on every render
   * (e.g. the async existing-bookings fetch resolving after an optimistic
   * first pick would otherwise wrongly trigger a "pick a new time" prompt
   * on a customer's very first pass through the calendar).
   */
  /**
   * Start at 0 so a remount after "add another" (new longer duration + restored
   * slot) always revalidates. Same-duration updates after the first pass still
   * skip, avoiding a false retime when existing bookings load async.
   */
  const lastConfirmedDurationRef = useRef(0);
  useEffect(() => {
    if (!isMultiJobVisit || !selectedDate || !selectedTime) {
      lastConfirmedDurationRef.current = totalBookingDurationMinutes;
      return;
    }

    const duration = totalBookingDurationMinutes;
    const previousDuration = lastConfirmedDurationRef.current;
    if (duration <= previousDuration) {
      // Same or shorter visit — the already-selected slot still works.
      lastConfirmedDurationRef.current = duration;
      return;
    }
    lastConfirmedDurationRef.current = duration;

    if (!appointmentFitsSameDay(selectedTime, duration)) {
      setSelectedTime(null);
      setScheduleNeedsRetiming(true);
      setShowFullCalendar(true);
      if (step !== 'schedule') setStep('schedule');
      return;
    }

    const slots = generateTimeSlots(
      selectedDate,
      weeklySchedule,
      duration,
      existingBookings,
      30,
      isOwnerManualBooking ? [] : timeOffBlocksProp,
      effectiveMinimumNotice,
      { requireDurationWithinHours: true }
    );
    if (!slots.includes(selectedTime)) {
      setSelectedTime(null);
      setScheduleNeedsRetiming(true);
      setShowFullCalendar(true);
      if (step !== 'schedule') setStep('schedule');
    }
  }, [
    isMultiJobVisit,
    selectedDate,
    selectedTime,
    totalBookingDurationMinutes,
    weeklySchedule,
    existingBookings,
    isOwnerManualBooking,
    timeOffBlocksProp,
    effectiveMinimumNotice,
    step,
  ]);

  /** Powers the "Next available" one-tap quick-pick card above the calendar. */
  const earliestAvailableSlot = useMemo(
    () =>
      findEarliestAvailableSlot({
        weeklySchedule,
        serviceDurationMinutes: totalBookingDurationMinutes,
        existingBookings,
        timeOffBlocks: isOwnerManualBooking ? [] : timeOffBlocksProp,
        minimumNotice: effectiveMinimumNotice,
      }),
    [
      weeklySchedule,
      totalBookingDurationMinutes,
      existingBookings,
      isOwnerManualBooking,
      timeOffBlocksProp,
      effectiveMinimumNotice,
    ]
  );

  const handleQuickBookEarliest = () => {
    if (!earliestAvailableSlot) return;
    setSelectedDate(earliestAvailableSlot.date);
    setSelectedTime(earliestAvailableSlot.time);
    setScheduleNeedsRetiming(false);
    persistVisitDraft({
      step: 'details',
      detailsSubStep: 'contact',
      selectedDate: earliestAvailableSlot.date,
      selectedTime: earliestAvailableSlot.time,
    });
    setDetailsSubStep('contact');
    setAgreedToPublicNotifications(true);
    setStep('details');
  };

  const serviceDateYmd = useMemo(
    () => (selectedDate ? formatServiceDateYmd(selectedDate) : null),
    [selectedDate]
  );

  const bookingSalePricing = useMemo(
    () =>
      computeBookingSalePricing(totalPriceCents, activeSale, serviceDateYmd),
    [totalPriceCents, activeSale, serviceDateYmd]
  );

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedBookingPromo | null>(
    null
  );
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  /** Promo wins over sale for display + pay-in-full (never stack). */
  const bookingDiscountPricing = useMemo(() => {
    if (appliedPromo && appliedPromo.discountCents > 0) {
      return {
        source: 'promo' as const,
        subtotalCents: appliedPromo.subtotalCents,
        discountCents: appliedPromo.discountCents,
        estimatedTotalCents: appliedPromo.estimatedTotalCents,
        applies: true,
        appliesLine: appliedPromo.label,
      };
    }
    if (bookingSalePricing.saleApplies && activeSale) {
      const discountLabel = formatPublicSaleDiscountLabel(
        activeSale.discountType,
        activeSale.discountValue,
        ui.profile.saleBannerOffLabel
      );
      return {
        source: 'sale' as const,
        subtotalCents: bookingSalePricing.subtotalCents,
        discountCents: bookingSalePricing.discountCents,
        estimatedTotalCents: bookingSalePricing.estimatedTotalCents,
        applies: true,
        appliesLine:
          discountLabel != null
            ? ui.calendar.saleApplies(activeSale.name, discountLabel)
            : null,
      };
    }
    return {
      source: null,
      subtotalCents: totalPriceCents,
      discountCents: 0,
      estimatedTotalCents: totalPriceCents,
      applies: false,
      appliesLine: null as string | null,
    };
  }, [appliedPromo, bookingSalePricing, activeSale, totalPriceCents, ui]);

  const saleAppliesLine = bookingDiscountPricing.appliesLine;

  const customerForSubmit = useMemo(() => {
    if (!customerAddressEntryRequired(serviceLocation, customerServiceChoice)) {
      return prefillCustomerWithShopAddress(customerData, serviceLocation);
    }
    return customerData;
  }, [customerData, serviceLocation, customerServiceChoice]);

  useEffect(() => {
    if (appliedPromo && appliedPromo.subtotalCents !== totalPriceCents) {
      setAppliedPromo(null);
      setPromoError(null);
    }
  }, [totalPriceCents, appliedPromo]);

  const promoCodeYmdRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      appliedPromo &&
      serviceDateYmd &&
      promoCodeYmdRef.current != null &&
      promoCodeYmdRef.current !== serviceDateYmd
    ) {
      setAppliedPromo(null);
      setPromoError(null);
    }
    promoCodeYmdRef.current = serviceDateYmd;
  }, [serviceDateYmd, appliedPromo]);

  const mapPromoErrorCode = (errorCode: string | undefined): string => {
    switch (errorCode) {
      case 'inactive':
        return ui.calendar.promoCodeInactive;
      case 'scheduled':
        return ui.calendar.promoCodeScheduled;
      case 'expired':
        return ui.calendar.promoCodeExpired;
      case 'already_used':
        return ui.calendar.promoCodeAlreadyUsed;
      case 'identity_required':
        return ui.calendar.promoCodeIdentityRequired;
      case 'unavailable':
        return ui.calendar.promoCodeUnavailable;
      default:
        return ui.calendar.promoCodeInvalid;
    }
  };

  const handleApplyPromoCode = async () => {
    if (!serviceDateYmd || totalPriceCents <= 0) {
      setPromoError(ui.calendar.promoCodeInvalid);
      return;
    }
    setPromoError(null);
    setIsApplyingPromo(true);
    try {
      const res = await fetch(API_ROUTES.PUBLIC_PROMO_CODE_VALIDATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          promoCode: promoInput,
          serviceDate: serviceDateYmd,
          subtotalCents: totalPriceCents,
          customerPhone: customerForSubmit.phone,
          customerEmail: customerForSubmit.email,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        promoCode?: string;
        label?: string;
        discountCents?: number;
        subtotalCents?: number;
        estimatedTotalCents?: number;
        errorCode?: string;
        error?: string;
      };
      if (!res.ok || json.success === false) {
        setAppliedPromo(null);
        setPromoError(mapPromoErrorCode(json.errorCode));
        return;
      }
      if (
        !json.promoCode ||
        !json.label ||
        typeof json.discountCents !== 'number' ||
        typeof json.subtotalCents !== 'number' ||
        typeof json.estimatedTotalCents !== 'number'
      ) {
        setAppliedPromo(null);
        setPromoError(ui.calendar.promoCodeInvalid);
        return;
      }
      setAppliedPromo({
        code: json.promoCode,
        label: json.label,
        discountCents: json.discountCents,
        subtotalCents: json.subtotalCents,
        estimatedTotalCents: json.estimatedTotalCents,
      });
      setPromoInput(json.promoCode);
      setPromoError(null);
    } catch {
      setAppliedPromo(null);
      setPromoError(ui.calendar.promoCodeInvalid);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const customerServiceLocationPayload = useMemo(
    () =>
      resolveCustomerServiceLocationPayload(
        serviceLocation,
        customerServiceChoice
      ),
    [serviceLocation, customerServiceChoice]
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    date: string;
    time: string;
    customer: CustomerFormData;
    selectedAddOns: AddOnDisplay[];
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    paymentStatus: string;
    currency: string;
    paidOnlineAmountCents: number;
    remainingAmountCents: number;
    totalAmountCents: number;
    serviceName: string;
    scheduledDate: string;
    startTime: string;
    durationMinutes: number | null;
    servicePriceCents: number | null;
    selectedAddOns: AddOnDisplay[];
    customerVehicleYear: string | null;
    customerVehicleMake: string | null;
    customerVehicleModel: string | null;
  } | null>(null);
  const [customerPaymentChoice, setCustomerPaymentChoice] =
    useState<PaymentChoice | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const stripeReturnSessionId = useMemo(
    () =>
      searchParams.get('session_id')?.trim() ||
      (stripeCheckoutSessionId?.trim() ?? ''),
    [searchParams, stripeCheckoutSessionId]
  );
  const resumeQueryForCheckout = useMemo(() => {
    const qp = new URLSearchParams(searchKey);
    qp.delete('checkout');
    qp.delete('session_id');
    return qp.toString();
  }, [searchKey]);

  /** Skip one scroll-to-top after Stripe return so the fixed pay bar stays tappable on mobile. */
  const skipNextStepScrollRef = useRef(false);

  useScrollWindowToTopOnChange([step, detailsSubStep], {
    skipRef: skipNextStepScrollRef,
  });

  const paymentSettingsEnabled =
    paymentSettings?.paymentsEnabled === true && !isOwnerManualBooking;
  const hasCheckoutModeConfigured = paymentSettings?.checkoutMode != null;
  /**
   * Fallback behavior: if owner didn't finish payment setup (no checkout mode
   * selected), skip payment step and use normal confirm-booking flow.
   * Deposits can be off while checkout is still fully valid.
   */
  const shouldShowPaymentStep =
    paymentSettingsEnabled && hasCheckoutModeConfigured;
  const configuredDepositCents = paymentSettings
    ? getDepositDueNowCents(paymentSettings, totalPriceCents)
    : 0;
  const requiresDepositNow =
    paymentSettingsEnabled &&
    paymentSettings?.depositsEnabled === true &&
    configuredDepositCents > 0;
  const depositIsPercent =
    requiresDepositNow && paymentSettings?.depositType === 'percent';
  const depositPercentWhole =
    depositIsPercent && paymentSettings
      ? Math.min(100, Math.max(0, Math.round(paymentSettings.depositValue)))
      : null;
  const requiresPayNow =
    paymentSettings?.checkoutMode === 'in_app' ||
    (paymentSettings?.checkoutMode === 'customer_choice' &&
      customerPaymentChoice === 'pay_now');
  /** Discount-adjusted total for display + pay-in-full; deposits stay on pre-discount. */
  const bookingDisplayTotalCents = bookingDiscountPricing.applies
    ? bookingDiscountPricing.estimatedTotalCents
    : totalPriceCents;
  const amountDueNowCents = (() => {
    const base = computeOnlineAmountDueNowCents(
      paymentSettings,
      paymentSettingsEnabled,
      customerPaymentChoice,
      totalPriceCents
    );
    if (requiresPayNow && bookingDiscountPricing.applies) {
      return bookingDisplayTotalCents;
    }
    return base;
  })();
  const amountDueLaterCents = Math.max(
    0,
    bookingDisplayTotalCents - amountDueNowCents
  );

  const paymentCurrency = paymentSettings?.currency ?? 'usd';
  const paymentChoiceGroupLabelId = useId();
  const paymentChoiceGroupDescId = useId();
  const paymentDepositLeadId = useId();

  const paymentStepCtaLabel = useMemo(() => {
    if (
      paymentSettings?.checkoutMode === 'customer_choice' &&
      customerPaymentChoice === null
    ) {
      return ui.calendar.chooseHowToPay;
    }
    if (amountDueNowCents <= 0) return ui.calendar.confirmBooking;
    const amt = formatPrice(
      amountDueNowCents,
      paymentCurrency,
      bookingFlowLocale
    );
    if (requiresPayNow && amountDueNowCents >= bookingDisplayTotalCents) {
      return ui.calendar.payAmount(amt);
    }
    if (requiresDepositNow && amountDueNowCents < bookingDisplayTotalCents) {
      return ui.calendar.payDepositAmount(amt);
    }
    return ui.calendar.payAmount(amt);
  }, [
    amountDueNowCents,
    bookingDisplayTotalCents,
    requiresPayNow,
    requiresDepositNow,
    paymentCurrency,
    paymentSettings?.checkoutMode,
    customerPaymentChoice,
    ui,
    bookingFlowLocale,
  ]);

  /** Shown with the spinner while the payment CTA is working (no ellipsis). */
  const paymentPrimaryBusyLabel = useMemo(() => {
    if (amountDueNowCents > 0) {
      return ui.calendar.goingToCheckout;
    }
    return ui.calendar.confirmingBooking;
  }, [amountDueNowCents, ui]);

  const canContinueFromSchedule = Boolean(selectedDate && selectedTime);
  const canContinueFromLocation = isCustomerServiceLocationChoiceValid(
    serviceLocation,
    customerServiceChoice
  );
  const requireVehicleFields = showVehicleFields && !isOwnerManualBooking;
  const requirePetFields = showPetFields && !isOwnerManualBooking;
  const detailsFormValid = isBookingDetailsSubStepValid(
    detailsSubStep,
    customerData,
    serviceLocation,
    customerServiceChoice,
    {
      showVehicleFields: effectiveShowVehicleFields,
      requireVehicleFields: effectiveShowVehicleFields && requireVehicleFields,
      showPetFields: effectiveShowPetFields,
      requirePetFields: effectiveShowPetFields && requirePetFields,
      emailOptional: true,
    }
  );
  const multiJobVehiclesIncomplete =
    detailsSubStep === 'vehicleNotes' &&
    isMultiJobVisit &&
    requireVehicleFields &&
    !areVisitJobVehiclesComplete(visitJobs);
  const multiJobPetsIncomplete =
    detailsSubStep === 'vehicleNotes' &&
    isMultiJobVisit &&
    requirePetFields &&
    !areVisitJobPetsComplete(visitJobs);

  const toastMultiJobVehicleRequired = () => {
    const incomplete = firstIncompleteVisitJob(visitJobs);
    toast.error(
      incomplete
        ? ui.multiJob.vehicleRequiredToastForJob(incomplete.serviceName)
        : ui.multiJob.vehicleRequiredToast
    );
  };
  const toastMultiJobPetRequired = () => {
    const incomplete = firstIncompleteVisitPetJob(visitJobs);
    toast.error(
      incomplete
        ? ui.multiJob.petRequiredToastForJob(incomplete.serviceName)
        : ui.multiJob.petRequiredToast
    );
  };
  const multiJobAssetsIncomplete =
    multiJobVehiclesIncomplete || multiJobPetsIncomplete;
  const toastMultiJobAssetRequired = () => {
    if (multiJobVehiclesIncomplete) {
      toastMultiJobVehicleRequired();
      return;
    }
    toastMultiJobPetRequired();
  };
  const detailsPrimaryCtaLabel =
    detailsSubStep === 'vehicleNotes'
      ? isMultiJobVisit && (!selectedDate || !selectedTime)
        ? ui.bookPicker.continueToSchedule
        : ui.calendar.reviewBookingCta
      : ui.common.continue;
  const canContinueFromPayment =
    !isSubmitting &&
    (paymentSettings?.checkoutMode !== 'customer_choice' ||
      customerPaymentChoice !== null);

  useEffect(() => {
    if (!shouldShowPaymentStep) {
      setCustomerPaymentChoice(null);
      return;
    }
    if (paymentSettings?.checkoutMode === 'in_person') {
      setCustomerPaymentChoice('pay_in_person');
      return;
    }
    if (paymentSettings?.checkoutMode === 'in_app') {
      setCustomerPaymentChoice('pay_now');
      return;
    }
    setCustomerPaymentChoice(null);
  }, [paymentSettings?.checkoutMode, shouldShowPaymentStep]);

  // After Stripe (browser back, cancel link, or success): restore context / clean URL.
  useEffect(() => {
    const checkout = searchParams.get('checkout');

    const stripCheckoutParamsFromUrl = () => {
      const next = new URLSearchParams(searchParams.toString());
      if (!next.has('checkout') && !next.has('session_id')) return;
      next.delete('checkout');
      next.delete('session_id');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    if (checkout === 'success') {
      const sessionId =
        searchParams.get('session_id')?.trim() ||
        stripeCheckoutSessionId?.trim() ||
        '';
      if (!sessionId) {
        clearBookingCheckoutResumeDraft(businessSlug, serviceId);
        stripCheckoutParamsFromUrl();
        return;
      }
      const loadSummary = async () => {
        try {
          const url = new URL(
            API_ROUTES.PUBLIC_BOOKING_CHECKOUT_SUMMARY,
            typeof window !== 'undefined'
              ? window.location.origin
              : 'http://localhost:3000'
          );
          url.searchParams.set('session_id', sessionId);
          url.searchParams.set('businessSlug', businessSlug);

          for (let attempt = 0; attempt < 8; attempt++) {
            const res = await fetch(url.toString(), { method: 'GET' });
            const json = (await res.json().catch(() => ({}))) as {
              success?: boolean;
              pending?: boolean;
              error?: string;
              data?: {
                paymentStatus: string;
                currency: string;
                paidOnlineAmountCents: number;
                remainingAmountCents: number;
                totalAmountCents: number;
                booking: {
                  serviceName: string;
                  scheduledDate: string;
                  startTime: string;
                  durationMinutes: number | null;
                  servicePriceCents: number | null;
                  selectedAddOns: AddOnDisplay[];
                  customerVehicleYear: string | null;
                  customerVehicleMake: string | null;
                  customerVehicleModel: string | null;
                };
              };
            };

            if (res.ok && json.success && json.data?.booking) {
              setPaymentSuccessData({
                paymentStatus: json.data.paymentStatus,
                currency: json.data.currency,
                paidOnlineAmountCents: json.data.paidOnlineAmountCents,
                remainingAmountCents: json.data.remainingAmountCents,
                totalAmountCents: json.data.totalAmountCents,
                serviceName: json.data.booking.serviceName,
                scheduledDate: json.data.booking.scheduledDate,
                startTime: json.data.booking.startTime,
                durationMinutes: json.data.booking.durationMinutes,
                servicePriceCents: json.data.booking.servicePriceCents,
                selectedAddOns: json.data.booking.selectedAddOns ?? [],
                customerVehicleYear: json.data.booking.customerVehicleYear,
                customerVehicleMake: json.data.booking.customerVehicleMake,
                customerVehicleModel: json.data.booking.customerVehicleModel,
              });
              clearBookingCheckoutResumeDraft(businessSlug, serviceId);
              if (isMultiJobVisit) {
                onPublicMultiJobBookingCreated?.();
              }
              stripCheckoutParamsFromUrl();
              return;
            }

            const isProcessing =
              res.status === 202 ||
              (res.status === 404 && attempt < 7) ||
              json.pending === true;
            if (!isProcessing) {
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 700));
          }
        } catch {
          // keep flow resilient if summary endpoint is temporarily unavailable
        }
        setSubmitError(ui.calendar.paymentFinalizeWait);
      };
      void loadSummary();
      return;
    }

    const draft = loadBookingCheckoutResumeDraft(businessSlug, serviceId);
    const shouldTryRestore =
      checkout === 'cancel' || draft?.awaitingStripeReturn === true;

    if (!shouldTryRestore) return;

    if (!draft) {
      if (checkout === 'cancel') stripCheckoutParamsFromUrl();
      return;
    }

    if (Date.now() - draft.savedAt > BOOKING_CHECKOUT_RESUME_MAX_AGE_MS) {
      clearBookingCheckoutResumeDraft(businessSlug, serviceId);
      if (checkout === 'cancel') stripCheckoutParamsFromUrl();
      return;
    }

    const parsedDate = new Date(draft.selectedDate);
    if (Number.isNaN(parsedDate.getTime())) {
      clearBookingCheckoutResumeDraft(businessSlug, serviceId);
      if (checkout === 'cancel') stripCheckoutParamsFromUrl();
      return;
    }

    setSelectedDate(parsedDate);
    setSelectedTime(draft.selectedTime);
    setCustomerData({ ...INITIAL_CUSTOMER_FORM_DATA, ...draft.customerData });
    setCustomerPaymentChoice(draft.customerPaymentChoice);
    skipNextStepScrollRef.current = true;
    // Return to review summary after Stripe return.
    setAgreedToPublicNotifications(true);
    setStep('review');
    setSubmitError(null);
    setIsSubmitting(false);

    clearBookingCheckoutResumeDraft(businessSlug, serviceId);
    stripCheckoutParamsFromUrl();
  }, [
    businessSlug,
    serviceId,
    searchKey,
    pathname,
    router,
    searchParams,
    stripeCheckoutSessionId,
    ui,
    isMultiJobVisit,
    onPublicMultiJobBookingCreated,
  ]);

  const continueFromSchedule = () => {
    // Customer path: date & time → your information.
    persistVisitDraft({ step: 'details', detailsSubStep: 'contact' });
    setDetailsSubStep('contact');
    setAgreedToPublicNotifications(true);
    setStep('details');
  };

  const openScheduleFromLocation = () => {
    if (!canContinueFromLocation) return;
    setStep('schedule');
  };

  const openDetailsFromReview = () => {
    setDetailsSubStep('vehicleNotes');
    setStep('details');
  };

  const handleDetailsSubStepSubmit = () => {
    if (multiJobAssetsIncomplete) {
      toastMultiJobAssetRequired();
      return;
    }

    const next = getNextDetailsSubStep(
      detailsSubStep,
      serviceLocation,
      customerServiceChoice
    );

    if (next === 'review') {
      if (!selectedDate || !selectedTime) {
        persistVisitDraft({
          step: 'schedule',
          detailsSubStep: 'vehicleNotes',
        });
        setStep('schedule');
        return;
      }
      persistVisitDraft({ step: 'review', detailsSubStep: 'vehicleNotes' });
      setStep('review');
      return;
    }

    setDetailsSubStep(next);
    persistVisitDraft({ detailsSubStep: next, step: 'details' });
  };

  const handleDetailsBack = () => {
    const prev = getPrevDetailsSubStep(
      detailsSubStep,
      serviceLocation,
      customerServiceChoice
    );
    if (prev === 'schedule') {
      setStep('schedule');
      return;
    }
    setDetailsSubStep(prev);
  };

  const handleStartCheckout = async (amountToChargeCents: number) => {
    logBookingCheckoutDev('handleStartCheckout called', {
      amountToChargeCents,
      paymentSettingsEnabled,
      businessSlug,
      checkoutMode: paymentSettings?.checkoutMode ?? null,
      customerPaymentChoice,
      totalPriceCents,
    });
    if (!paymentSettingsEnabled) {
      logBookingCheckoutDev(
        'checkout aborted: payments not enabled for this session'
      );
      setSubmitError(ui.calendar.onlinePaymentUnavailable);
      return;
    }
    if (!Number.isFinite(amountToChargeCents) || amountToChargeCents < 50) {
      logBookingCheckoutDev('checkout aborted: invalid amount', {
        amountToChargeCents,
      });
      setSubmitError(ui.calendar.invalidPaymentAmount);
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    const checkoutUrl = new URL(
      API_ROUTES.PUBLIC_BOOKING_CHECKOUT,
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000'
    ).toString();

    const scheduledDateStr = selectedDate
      ? (serviceDateYmd ?? selectedDate.toISOString().slice(0, 10))
      : '';

    const multiJobPayload =
      isMultiJobVisit && selectedDate
        ? {
            ...buildPublicMultiJobBookingBody({
              businessId,
              businessSlug,
              jobs: visitJobs,
              scheduledDate: scheduledDateStr,
              startTime: selectedTime ?? '',
              customer: customerForSubmit,
              customerServiceLocation:
                customerServiceLocationPayload ?? undefined,
              paymentMethodSelected: customerPaymentChoice ?? 'none',
              promoCode: appliedPromo?.code,
              ...(!isOwnerManualBooking
                ? { agreedToNotifications: agreedToPublicNotifications }
                : {}),
            }),
            ...publicMultiJobCheckoutTotals(visitJobs),
            totalPriceCents: bookingDisplayTotalCents,
            requiredOnlineAmountCents: Math.round(amountToChargeCents),
            paymentMethodSelected: customerPaymentChoice ?? 'none',
            depositType: requiresDepositNow
              ? (paymentSettings?.depositType ?? null)
              : null,
            depositValue: requiresDepositNow
              ? (paymentSettings?.depositValue ?? null)
              : null,
          }
        : null;

    const payload = {
      businessSlug,
      amountCents: Math.round(amountToChargeCents),
      serviceName: displayServiceName?.trim() || 'Service',
      bookingPayload: multiJobPayload
        ? multiJobPayload
        : selectedDate
          ? {
              businessSlug,
              businessId,
              serviceId,
              serviceName: serviceName?.trim() || 'Service',
              servicePriceOptionLabel:
                selectedPriceOptionLabel?.trim() || undefined,
              servicePriceCents:
                servicePriceCents != null ? Math.max(0, servicePriceCents) : 0,
              selectedAddOns:
                selectedAddOns.length > 0
                  ? selectedAddOns.map(a => ({
                      id: a.id,
                      name: a.name,
                      priceCents: a.priceCents,
                      durationMinutes: a.durationMinutes ?? undefined,
                    }))
                  : [],
              durationMinutes: totalBookingDurationMinutes,
              scheduledDate: scheduledDateStr,
              startTime: selectedTime ?? '',
              customer: {
                ...customerForSubmit,
              },
              ...(customerServiceLocationPayload
                ? {
                    customerServiceLocation: customerServiceLocationPayload,
                    serviceLocationType: customerServiceLocationPayload,
                  }
                : {}),
              totalPriceCents: bookingDisplayTotalCents,
              requiredOnlineAmountCents: Math.round(amountToChargeCents),
              paymentMethodSelected: customerPaymentChoice ?? 'none',
              depositType: requiresDepositNow
                ? (paymentSettings?.depositType ?? null)
                : null,
              depositValue: requiresDepositNow
                ? (paymentSettings?.depositValue ?? null)
                : null,
              ...(appliedPromo?.code ? { promoCode: appliedPromo.code } : {}),
              ...(!isOwnerManualBooking
                ? { agreedToNotifications: agreedToPublicNotifications }
                : {}),
            }
          : null,
      ...(resumeQueryForCheckout
        ? { resumeQuery: resumeQueryForCheckout }
        : {}),
    };
    logBookingCheckoutDev('POST booking-checkout', { checkoutUrl, payload });
    try {
      const res = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      logBookingCheckoutDev('booking-checkout response', {
        httpStatus: res.status,
        ok: res.ok,
        success: json.success,
        hasUrl: Boolean(json.url?.trim()),
        error: json.error ?? null,
      });
      if (!res.ok || json.success === false || !json.url?.trim()) {
        setSubmitError(
          publicBookingFlowUserFacingError(
            json.error,
            'checkout',
            bookingFlowLocale
          )
        );
        setIsSubmitting(false);
        return;
      }
      logBookingCheckoutDev('redirecting to Stripe Checkout', {
        urlOrigin: (() => {
          try {
            return new URL(json.url!).origin;
          } catch {
            return 'invalid-url';
          }
        })(),
      });
      if (selectedDate && selectedTime) {
        saveBookingCheckoutResumeDraft({
          v: 1,
          savedAt: Date.now(),
          businessSlug,
          serviceId,
          awaitingStripeReturn: true,
          selectedDate: selectedDate.toISOString(),
          selectedTime,
          customerData: { ...INITIAL_CUSTOMER_FORM_DATA, ...customerData },
          customerPaymentChoice,
        });
      }
      window.location.assign(json.url);
      // Intentionally do not setIsSubmitting(false) — we are leaving for Stripe.
    } catch (err) {
      logBookingCheckoutDev('booking-checkout fetch threw', {
        message: err instanceof Error ? err.message : String(err),
      });
      setSubmitError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const scheduledDate = formatServiceDateYmd(selectedDate);
    try {
      const paymentMethodForPublicCreate =
        shouldShowPaymentStep && customerPaymentChoice === 'pay_in_person'
          ? ('pay_in_person' as const)
          : ('none' as const);

      const body = isMultiJobVisit
        ? buildPublicMultiJobBookingBody({
            businessId,
            businessSlug,
            jobs: visitJobs,
            scheduledDate,
            startTime: selectedTime,
            customer: customerForSubmit,
            customerServiceLocation:
              customerServiceLocationPayload ?? undefined,
            paymentMethodSelected: paymentMethodForPublicCreate,
            promoCode: appliedPromo?.code,
            ...(!isOwnerManualBooking
              ? { agreedToNotifications: agreedToPublicNotifications }
              : {}),
          })
        : {
            businessSlug,
            businessId,
            serviceId,
            serviceName,
            servicePriceOptionLabel:
              selectedPriceOptionLabel?.trim() || undefined,
            servicePriceCents: servicePriceCents ?? undefined,
            selectedAddOns:
              selectedAddOns.length > 0
                ? selectedAddOns.map(a => ({
                    id: a.id,
                    name: a.name,
                    priceCents: a.priceCents,
                    durationMinutes: a.durationMinutes ?? undefined,
                  }))
                : undefined,
            durationMinutes: totalBookingDurationMinutes,
            scheduledDate,
            startTime: selectedTime,
            customer: customerForSubmit,
            ...(customerServiceLocationPayload
              ? {
                  customerServiceLocation: customerServiceLocationPayload,
                  serviceLocationType: customerServiceLocationPayload,
                }
              : {}),
            paymentMethodSelected: paymentMethodForPublicCreate,
            ...(isOwnerManualBooking ? { ownerManualBooking: true } : {}),
            ...(!isOwnerManualBooking && appliedPromo?.code
              ? { promoCode: appliedPromo.code }
              : {}),
            ...(!isOwnerManualBooking
              ? { agreedToNotifications: agreedToPublicNotifications }
              : {}),
          };

      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(
          publicBookingFlowUserFacingError(
            json.error,
            'booking',
            bookingFlowLocale
          )
        );
        return;
      }
      if (isMultiJobVisit) {
        onPublicMultiJobBookingCreated?.();
      }
      setSubmittedData({
        date: scheduledDate,
        time: formatBookingWallTime(selectedTime, bookingFlowLocale),
        customer: customerForSubmit,
        selectedAddOns,
      });
      setShowSuccess(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess && submittedData) {
    return (
      <BookingSuccess
        businessName={businessName}
        businessSlug={businessSlug}
        serviceName={displayServiceName}
        serviceVariantLabel={
          isMultiJobVisit ? undefined : selectedPriceOptionLabel
        }
        servicePriceCents={
          isMultiJobVisit ? totalPriceCents : servicePriceCents
        }
        selectedAddOns={isMultiJobVisit ? [] : submittedData.selectedAddOns}
        totalPriceCents={totalPriceCents}
        saleSubtotalCents={
          bookingDiscountPricing.applies
            ? bookingDiscountPricing.subtotalCents
            : undefined
        }
        saleEstimatedTotalCents={
          bookingDiscountPricing.applies
            ? bookingDiscountPricing.estimatedTotalCents
            : undefined
        }
        saleAppliesLine={saleAppliesLine}
        customer={submittedData.customer}
        date={submittedData.date}
        time={submittedData.time}
        isOwnerManualBooking={isOwnerManualBooking}
        bookingFlowLocale={bookingFlowLocale}
      />
    );
  }

  const checkoutQ = searchParams.get('checkout');
  const isAwaitingStripeCheckoutSummary =
    !paymentSuccessData &&
    Boolean(stripeReturnSessionId) &&
    (checkoutQ === 'success' || Boolean(stripeCheckoutSessionId?.trim()));

  if (isAwaitingStripeCheckoutSummary) {
    return (
      <div className="flex flex-col w-full min-h-[55vh] max-w-2xl mx-auto items-center justify-center py-16 px-4 sm:px-6">
        <div
          className="h-10 w-10 rounded-full border-2 border-white/15 border-t-emerald-400 animate-spin"
          role="status"
          aria-label={ui.calendar.confirmingPaymentAria}
        />
        <p className="mt-6 text-sm text-gray-400 text-center max-w-xs">
          {ui.calendar.confirmingPaymentText}
        </p>
      </div>
    );
  }

  if (paymentSuccessData) {
    return (
      <BookingPaymentSuccess
        businessName={businessName}
        businessSlug={businessSlug}
        serviceName={paymentSuccessData.serviceName}
        scheduledDate={paymentSuccessData.scheduledDate}
        startTime={paymentSuccessData.startTime}
        currency={paymentSuccessData.currency}
        paidOnlineAmountCents={paymentSuccessData.paidOnlineAmountCents}
        remainingAmountCents={paymentSuccessData.remainingAmountCents}
        paymentStatus={paymentSuccessData.paymentStatus}
        totalAmountCents={paymentSuccessData.totalAmountCents}
        durationMinutes={paymentSuccessData.durationMinutes}
        servicePriceCents={paymentSuccessData.servicePriceCents}
        selectedAddOns={paymentSuccessData.selectedAddOns}
        customerVehicleYear={paymentSuccessData.customerVehicleYear}
        customerVehicleMake={paymentSuccessData.customerVehicleMake}
        customerVehicleModel={paymentSuccessData.customerVehicleModel}
        bookingFlowLocale={bookingFlowLocale}
      />
    );
  }

  const headerClassName = publicFlowBackNavClassName;

  const trackerStage: PublicBookingTrackerStage =
    step === 'details'
      ? 'details'
      : step === 'review' || step === 'payment'
        ? 'confirm'
        : 'time';

  const promoCodeField = (
    <BookingPromoCodeField
      value={promoInput}
      onChange={setPromoInput}
      applied={appliedPromo}
      onApply={handleApplyPromoCode}
      onRemove={() => {
        setAppliedPromo(null);
        setPromoError(null);
      }}
      error={promoError}
      isApplying={isApplyingPromo}
      disabled={isSubmitting}
      labels={{
        heading: ui.calendar.promoCodeHeading,
        placeholder: ui.calendar.promoCodePlaceholder,
        apply: ui.calendar.promoCodeApply,
        applying: ui.calendar.promoCodeApplying,
        remove: ui.calendar.promoCodeRemove,
        applied: ui.calendar.promoCodeApplied,
      }}
    />
  );

  return (
    <>
      {/* Match ServiceDetailsScreen: full-width sticky bar; back row uses max-w-2xl + page gutters. */}
      <PublicFlowStickyBackHeader>
        {isOwnerManualBooking ? (
          <Link href={ROUTES.DASHBOARD.BOOKINGS} className={headerClassName}>
            <PublicFlowBackNavLabel label={ui.nav.backToBookings} />
          </Link>
        ) : (
          <>
            {step === 'location' && (
              <Link href={exitCalendarFlowHref} className={headerClassName}>
                <PublicFlowBackNavLabel label={exitCalendarFlowLabel} />
              </Link>
            )}
            {step === 'schedule' && (
              <>
                {needsInlineLocationStep ? (
                  <button
                    type="button"
                    onClick={() => setStep('location')}
                    className={headerClassName}
                  >
                    <PublicFlowBackNavLabel
                      label={ui.serviceLocation.backToServiceChoice}
                    />
                  </button>
                ) : (
                  <Link href={exitCalendarFlowHref} className={headerClassName}>
                    <PublicFlowBackNavLabel label={exitCalendarFlowLabel} />
                  </Link>
                )}
              </>
            )}
            {step === 'details' && (
              <button
                type="button"
                onClick={handleDetailsBack}
                className={headerClassName}
              >
                <PublicFlowBackNavLabel
                  label={
                    detailsSubStep === 'contact'
                      ? ui.nav.backToDateTime
                      : backToContactLabel
                  }
                />
              </button>
            )}
            {step === 'review' && (
              <button
                type="button"
                onClick={openDetailsFromReview}
                className={headerClassName}
              >
                <PublicFlowBackNavLabel label={ui.nav.backToDetails} />
              </button>
            )}
            {step === 'payment' && (
              <button
                type="button"
                onClick={() => setStep('review')}
                className={headerClassName}
              >
                <PublicFlowBackNavLabel label={ui.nav.backToReview} />
              </button>
            )}
          </>
        )}
      </PublicFlowStickyBackHeader>

      <div className="flex flex-col min-h-[60vh] max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-24 w-full">
        <div className="flex-1 pb-28">
          {!isOwnerManualBooking ? (
            <PublicBookingStepTracker
              currentStage={trackerStage}
              labels={ui.stepTracker}
            />
          ) : null}
          {/* Pre-schedule – Mobile vs shop (custom jobs / missing prior choice) */}
          {step === 'location' && (
            <div className="space-y-4">
              <BookingServiceLocationChoice
                value={customerServiceChoice}
                onChange={choice => {
                  setCustomerServiceChoice(choice);
                  if (choice === 'mobile') {
                    setCustomerData(prev => clearCustomerServiceAddress(prev));
                  }
                }}
                bookingFlowLocale={bookingFlowLocale}
                isOwnerManualBooking={isOwnerManualBooking}
              />
              {customerServiceChoice === 'shop' &&
              !serviceLocation.hasCompleteShopAddress ? (
                <p className="text-sm text-red-400" role="alert">
                  {ui.serviceLocation.shopAddressIncomplete}
                </p>
              ) : null}
            </div>
          )}

          {/* Step 1 – Schedule */}
          {step === 'schedule' && (
            <div className="space-y-6">
              <BookingPriceBreakdown
                serviceName={displayServiceName}
                serviceDurationMinutes={
                  isMultiJobVisit
                    ? totalBookingDurationMinutes
                    : serviceDurationMinutes
                }
                servicePriceCents={
                  isMultiJobVisit ? totalPriceCents : servicePriceCents
                }
                serviceVariantLabel={
                  isMultiJobVisit ? undefined : selectedPriceOptionLabel
                }
                selectedAddOns={isMultiJobVisit ? [] : selectedAddOns}
                totalBookingDurationMinutes={totalBookingDurationMinutes}
                totalPriceCents={totalPriceCents}
                saleSubtotalCents={
                  bookingSalePricing.saleApplies && !appliedPromo
                    ? bookingSalePricing.subtotalCents
                    : undefined
                }
                saleEstimatedTotalCents={
                  bookingSalePricing.saleApplies && !appliedPromo
                    ? bookingSalePricing.estimatedTotalCents
                    : undefined
                }
                saleAppliesLine={
                  appliedPromo
                    ? null
                    : bookingSalePricing.saleApplies
                      ? saleAppliesLine
                      : null
                }
                bookingFlowLocale={bookingFlowLocale}
              />
              {scheduleNeedsRetiming ? (
                <p
                  className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
                  role="status"
                >
                  {ui.multiJob.retimingRequired}
                </p>
              ) : null}
              {!isOwnerManualBooking &&
              !showFullCalendar &&
              earliestAvailableSlot ? (
                <QuickScheduleCard
                  date={earliestAvailableSlot.date}
                  time={earliestAvailableSlot.time}
                  bookingFlowLocale={bookingFlowLocale}
                  onBookThisTime={handleQuickBookEarliest}
                  onChooseDifferentTime={() => setShowFullCalendar(true)}
                  labels={ui.quickSchedule}
                />
              ) : (
                <>
                  {!isOwnerManualBooking && earliestAvailableSlot ? (
                    <button
                      type="button"
                      onClick={() => setShowFullCalendar(false)}
                      className="cursor-pointer text-sm font-medium text-gray-400 transition-colors hover:text-white"
                    >
                      {ui.quickSchedule.backToFirstAvailable}
                    </button>
                  ) : null}
                  <DateSelector
                    weeklySchedule={weeklySchedule}
                    serviceDurationMinutes={totalBookingDurationMinutes}
                    existingBookings={existingBookings}
                    timeOffBlocks={
                      isOwnerManualBooking ? [] : timeOffBlocksProp
                    }
                    minimumNotice={effectiveMinimumNotice}
                    selectedDate={selectedDate}
                    onSelectDate={date => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    onUserSelectDate={() => {
                      window.requestAnimationFrame(() => {
                        timeSlotsSectionRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      });
                    }}
                    bookingFlowLocale={bookingFlowLocale}
                  />
                  <div ref={timeSlotsSectionRef} className="scroll-mt-20">
                    <TimeSlotGrid
                      selectedDate={selectedDate}
                      serviceDurationMinutes={totalBookingDurationMinutes}
                      weeklySchedule={weeklySchedule}
                      existingBookings={existingBookings}
                      timeOffBlocks={
                        isOwnerManualBooking ? [] : timeOffBlocksProp
                      }
                      minimumNotice={effectiveMinimumNotice}
                      selectedTime={selectedTime}
                      onSelectTime={time => {
                        setSelectedTime(time);
                        setScheduleNeedsRetiming(false);
                      }}
                      autoSelectFirstAvailable={!scheduleNeedsRetiming}
                      heading={ui.calendar.chooseTime}
                      selectDateHint={ui.calendar.selectDateHint}
                      noSlotsHint={ui.calendar.noSlotsHint}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2 – Details */}
          {step === 'details' && (
            <div className="space-y-6">
              {detailsSubStep === 'contact' ? (
                <CustomerForm
                  id={CUSTOMER_FORM_ID}
                  step="contact"
                  showAddressFields={customerAddressEntryRequired(
                    serviceLocation,
                    customerServiceChoice
                  )}
                  value={customerData}
                  onChange={setCustomerData}
                  onSubmit={handleDetailsSubStepSubmit}
                  showVehicleFields={effectiveShowVehicleFields}
                  requireVehicleFields={requireVehicleFields}
                  showPetFields={effectiveShowPetFields}
                  requirePetFields={requirePetFields}
                  hideSubmitButton
                  submitLabel={detailsPrimaryCtaLabel}
                  bookingFlowLocale={bookingFlowLocale}
                  emailOptional
                  isOwnerManualBooking={isOwnerManualBooking}
                  showNotificationsConsent={!isOwnerManualBooking}
                  businessName={businessName}
                  agreedToNotifications={agreedToPublicNotifications}
                  onAgreedToNotificationsChange={setAgreedToPublicNotifications}
                />
              ) : null}
              {detailsSubStep === 'vehicleNotes' ? (
                <>
                  {isMultiJobVisit && showVehicleFields ? (
                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-white">
                        {ui.multiJob.vehiclePerService}
                      </h2>
                      {visitJobs.map(job => (
                        <div
                          key={job.localId}
                          className="rounded-xl border border-white/10 p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {job.serviceName}
                              </p>
                              {job.servicePriceOptionLabel?.trim() ? (
                                <p className="mt-0.5 text-sm text-gray-400">
                                  {job.servicePriceOptionLabel.trim()}
                                </p>
                              ) : null}
                            </div>
                            {visitJobs.length > 1 ? (
                              <button
                                type="button"
                                className="cursor-pointer shrink-0 text-xs text-red-400 hover:text-red-300"
                                onClick={() => removeVisitJob(job.localId)}
                              >
                                {ui.multiJob.remove}
                              </button>
                            ) : null}
                          </div>
                          <BookingVehicleFields
                            value={{
                              vehicleYear: job.vehicle.year,
                              vehicleMake: job.vehicle.make,
                              vehicleModel: job.vehicle.model,
                            }}
                            onChange={updates => {
                              updateVisitJobs(
                                visitJobs.map(j =>
                                  j.localId === job.localId
                                    ? {
                                        ...j,
                                        vehicle: {
                                          year:
                                            updates.vehicleYear ??
                                            j.vehicle.year,
                                          make:
                                            updates.vehicleMake ??
                                            j.vehicle.make,
                                          model:
                                            updates.vehicleModel ??
                                            j.vehicle.model,
                                        },
                                      }
                                    : j
                                )
                              );
                            }}
                            bookingFlowLocale={bookingFlowLocale}
                            required={requireVehicleFields}
                          />
                        </div>
                      ))}
                      {addAnotherJobHref &&
                      visitJobs.length < PUBLIC_BOOKING_MAX_JOBS ? (
                        <AddAnotherJobCard
                          label={ui.multiJob.addAnotherService}
                          onPress={persistVisitDraftAndAddAnother}
                        />
                      ) : visitJobs.length >= PUBLIC_BOOKING_MAX_JOBS ? (
                        <p className="text-xs text-amber-400/90">
                          {ui.multiJob.maxJobsReached}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {isMultiJobVisit && showPetFields ? (
                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-white">
                        {ui.multiJob.petPerService}
                      </h2>
                      {visitJobs.map(job => {
                        const pet = jobPetDraft(job);
                        return (
                          <div
                            key={job.localId}
                            className="rounded-xl border border-white/10 p-4"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                  {job.serviceName}
                                </p>
                                {job.servicePriceOptionLabel?.trim() ? (
                                  <p className="mt-0.5 text-sm text-gray-400">
                                    {job.servicePriceOptionLabel.trim()}
                                  </p>
                                ) : null}
                              </div>
                              {visitJobs.length > 1 ? (
                                <button
                                  type="button"
                                  className="cursor-pointer shrink-0 text-xs text-red-400 hover:text-red-300"
                                  onClick={() => removeVisitJob(job.localId)}
                                >
                                  {ui.multiJob.remove}
                                </button>
                              ) : null}
                            </div>
                            <BookingPetFields
                              value={{
                                petName: pet.name,
                                petSpecies: pet.species,
                                petBreed: pet.breed,
                                petSize: pet.size,
                              }}
                              onChange={updates => {
                                updateVisitJobs(
                                  visitJobs.map(j =>
                                    j.localId === job.localId
                                      ? {
                                          ...j,
                                          pet: {
                                            name:
                                              updates.petName ??
                                              jobPetDraft(j).name,
                                            species:
                                              updates.petSpecies ??
                                              jobPetDraft(j).species,
                                            breed:
                                              updates.petBreed ??
                                              jobPetDraft(j).breed,
                                            size:
                                              updates.petSize ??
                                              jobPetDraft(j).size,
                                          },
                                        }
                                      : j
                                  )
                                );
                              }}
                              bookingFlowLocale={bookingFlowLocale}
                              required={requirePetFields}
                            />
                          </div>
                        );
                      })}
                      {addAnotherJobHref &&
                      visitJobs.length < PUBLIC_BOOKING_MAX_JOBS ? (
                        <AddAnotherJobCard
                          label={ui.multiJob.addAnotherService}
                          onPress={persistVisitDraftAndAddAnother}
                        />
                      ) : visitJobs.length >= PUBLIC_BOOKING_MAX_JOBS ? (
                        <p className="text-xs text-amber-400/90">
                          {ui.multiJob.maxJobsReached}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {isMultiJobVisit && !showVehicleFields && !showPetFields ? (
                    <div className="space-y-3">
                      {visitJobs.length > 1 ? (
                        <ul className="space-y-2">
                          {visitJobs.map(job => (
                            <li
                              key={job.localId}
                              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                  {job.serviceName}
                                </p>
                                {job.servicePriceOptionLabel?.trim() ? (
                                  <p className="mt-0.5 text-sm text-gray-400">
                                    {job.servicePriceOptionLabel.trim()}
                                  </p>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                className="cursor-pointer shrink-0 text-xs text-red-400 hover:text-red-300"
                                onClick={() => removeVisitJob(job.localId)}
                              >
                                {ui.multiJob.remove}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {addAnotherJobHref &&
                      visitJobs.length < PUBLIC_BOOKING_MAX_JOBS ? (
                        <AddAnotherJobCard
                          label={ui.multiJob.addAnotherService}
                          onPress={persistVisitDraftAndAddAnother}
                        />
                      ) : null}
                    </div>
                  ) : null}
                  <CustomerForm
                    id={CUSTOMER_FORM_ID}
                    step="vehicleNotes"
                    value={customerData}
                    onChange={setCustomerData}
                    onSubmit={handleDetailsSubStepSubmit}
                    showVehicleFields={effectiveShowVehicleFields}
                    requireVehicleFields={
                      effectiveShowVehicleFields && requireVehicleFields
                    }
                    showPetFields={effectiveShowPetFields}
                    requirePetFields={
                      effectiveShowPetFields && requirePetFields
                    }
                    hideSubmitButton
                    submitLabel={detailsPrimaryCtaLabel}
                    bookingFlowLocale={bookingFlowLocale}
                    emailOptional
                    isOwnerManualBooking={isOwnerManualBooking}
                    showNotificationsConsent={!isOwnerManualBooking}
                    businessName={businessName}
                    agreedToNotifications={agreedToPublicNotifications}
                    onAgreedToNotificationsChange={
                      setAgreedToPublicNotifications
                    }
                  />
                </>
              ) : null}
            </div>
          )}

          {/* Step 3 – Confirm */}
          {step === 'review' && (
            <div className="space-y-4">
              {submitError && (
                <p className="text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              )}
              {!selectedDate || !selectedTime ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <p className="text-sm text-gray-300">
                    {ui.calendar.selectDateHint}
                  </p>
                  <Button
                    type="button"
                    variant="inverse"
                    fullWidth
                    className="font-semibold"
                    onClick={() => setStep('schedule')}
                  >
                    {ui.serviceDetails.dateAndTime}
                  </Button>
                </div>
              ) : isMultiJobVisit ? (
                <>
                  <PublicMultiJobReviewSummary
                    jobs={visitJobs}
                    customer={customerForSubmit}
                    scheduledDateYmd={serviceDateYmd ?? ''}
                    startTimeHhmm={selectedTime}
                    bookingFlowLocale={bookingFlowLocale}
                    isShopBooking={customerBookingUsesShop(
                      serviceLocation,
                      customerServiceChoice
                    )}
                    shopAddressLabel={serviceLocation.shopAddressLabel}
                    hideServiceAddress={
                      isOwnerManualBooking &&
                      customerBookingUsesShop(
                        serviceLocation,
                        customerServiceChoice
                      )
                    }
                    saleSubtotalCents={
                      bookingDiscountPricing.applies
                        ? bookingDiscountPricing.subtotalCents
                        : undefined
                    }
                    saleEstimatedTotalCents={
                      bookingDiscountPricing.applies
                        ? bookingDiscountPricing.estimatedTotalCents
                        : undefined
                    }
                    saleDiscountCents={
                      bookingDiscountPricing.applies
                        ? bookingDiscountPricing.discountCents
                        : undefined
                    }
                    saleAppliesLine={saleAppliesLine}
                    canAddAnotherJob={
                      Boolean(addAnotherJobHref) &&
                      visitJobs.length < PUBLIC_BOOKING_MAX_JOBS
                    }
                    onAddAnotherJob={
                      addAnotherJobHref
                        ? persistVisitDraftAndAddAnother
                        : undefined
                    }
                    addAnotherLabel={ui.multiJob.addAnotherService}
                    canRemoveJob={visitJobs.length > 1}
                    onRemoveJob={removeVisitJob}
                    removeLabel={ui.multiJob.remove}
                  />
                  {!shouldShowPaymentStep && !isOwnerManualBooking
                    ? promoCodeField
                    : null}
                </>
              ) : (
                <>
                  <BookingSummary
                    serviceName={displayServiceName}
                    serviceDurationMinutes={serviceDurationMinutes}
                    totalAppointmentMinutes={totalBookingDurationMinutes}
                    servicePriceCents={servicePriceCents}
                    serviceVariantLabel={selectedPriceOptionLabel}
                    selectedAddOns={selectedAddOns}
                    totalPriceCents={totalPriceCents}
                    saleSubtotalCents={
                      bookingDiscountPricing.applies
                        ? bookingDiscountPricing.subtotalCents
                        : undefined
                    }
                    saleEstimatedTotalCents={
                      bookingDiscountPricing.applies
                        ? bookingDiscountPricing.estimatedTotalCents
                        : undefined
                    }
                    saleDiscountCents={
                      bookingDiscountPricing.applies
                        ? bookingDiscountPricing.discountCents
                        : undefined
                    }
                    saleAppliesLine={saleAppliesLine}
                    date={serviceDateYmd ?? ''}
                    startTimeHhmm={selectedTime}
                    customer={customerForSubmit}
                    bookingFlowLocale={bookingFlowLocale}
                    isShopBooking={customerBookingUsesShop(
                      serviceLocation,
                      customerServiceChoice
                    )}
                    shopAddressLabel={serviceLocation.shopAddressLabel}
                    hideServiceAddress={
                      isOwnerManualBooking &&
                      customerBookingUsesShop(
                        serviceLocation,
                        customerServiceChoice
                      )
                    }
                  />
                  {!shouldShowPaymentStep && !isOwnerManualBooking
                    ? promoCodeField
                    : null}
                </>
              )}
            </div>
          )}

          {step === 'payment' && selectedDate && selectedTime && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white tracking-tight">
                {ui.calendar.paymentHeading}
              </h2>
              {submitError && (
                <p className="text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              )}

              {promoCodeField}

              {paymentSettingsEnabled && (
                <>
                  {(requiresDepositNow ||
                    paymentSettings?.checkoutMode !== 'customer_choice') && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                      {requiresDepositNow ? (
                        <p
                          id={paymentDepositLeadId}
                          className="text-sm text-gray-200 leading-relaxed"
                        >
                          {depositIsPercent && depositPercentWhole != null
                            ? ui.calendar.depositPercentLead(
                                businessName,
                                depositPercentWhole
                              )
                            : ui.calendar.depositFixedLead(
                                businessName,
                                formatPrice(
                                  configuredDepositCents,
                                  paymentCurrency,
                                  bookingFlowLocale
                                )
                              )}
                        </p>
                      ) : (
                        <p
                          id={paymentChoiceGroupDescId}
                          className="text-sm text-gray-300 leading-relaxed"
                        >
                          {paymentSettings?.checkoutMode === 'in_app' && (
                            <>{ui.calendar.payInFullLead(businessName)}</>
                          )}
                          {paymentSettings?.checkoutMode === 'in_person' && (
                            <>{ui.calendar.payInPersonLead(businessName)}</>
                          )}
                          {paymentSettings?.checkoutMode == null && (
                            <>{ui.calendar.paymentNotSetupLead(businessName)}</>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {paymentSettings?.checkoutMode === 'customer_choice' && (
                    <div
                      className="flex flex-col gap-3"
                      role="radiogroup"
                      aria-labelledby={paymentChoiceGroupLabelId}
                      aria-describedby={
                        requiresDepositNow ? paymentDepositLeadId : undefined
                      }
                    >
                      <p
                        id={paymentChoiceGroupLabelId}
                        className="text-sm font-semibold text-white tracking-tight"
                      >
                        {ui.calendar.howDoYouWantToPay}
                      </p>
                      <BookingPaymentOptionButton
                        selected={customerPaymentChoice === 'pay_now'}
                        onSelect={() => setCustomerPaymentChoice('pay_now')}
                        title={ui.calendar.payWithCard}
                        description={
                          requiresDepositNow
                            ? ui.calendar.payWithCardDescDeposit
                            : ui.calendar.payWithCardDescFull
                        }
                      />
                      <BookingPaymentOptionButton
                        selected={customerPaymentChoice === 'pay_in_person'}
                        onSelect={() =>
                          setCustomerPaymentChoice('pay_in_person')
                        }
                        title={ui.calendar.payInPerson}
                        description={
                          requiresDepositNow
                            ? ui.calendar.payInPersonDescDeposit
                            : ui.calendar.payInPersonDescNoDeposit
                        }
                      />
                    </div>
                  )}

                  {(paymentSettings?.checkoutMode === 'in_person' ||
                    paymentSettings?.checkoutMode === 'in_app' ||
                    paymentSettings?.checkoutMode == null) && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
                      {paymentSettings?.checkoutMode === 'in_person' && (
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {requiresDepositNow
                            ? ui.calendar.payInPersonNoteDeposit
                            : ui.calendar.payInPersonNoteNoDeposit}
                        </p>
                      )}

                      {paymentSettings?.checkoutMode === 'in_app' && (
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {requiresDepositNow
                            ? ui.calendar.payInAppNoteDeposit
                            : ui.calendar.payInAppNoteFull}
                        </p>
                      )}

                      {paymentSettings?.checkoutMode == null && (
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {ui.calendar.payNotSetupNote}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                    <p className="text-sm font-semibold text-white tracking-tight pb-3 border-b border-white/10">
                      {ui.common.summary}
                    </p>
                    <div className="flex flex-col gap-3.5 pt-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-gray-300 shrink-0">
                          {ui.common.bookingTotal}
                        </span>
                        {bookingDiscountPricing.applies ? (
                          <div className="flex items-baseline justify-end gap-2">
                            <span className="text-zinc-500 line-through decoration-zinc-500/70 tabular-nums">
                              {formatPrice(
                                bookingDiscountPricing.subtotalCents,
                                paymentCurrency,
                                bookingFlowLocale
                              )}
                            </span>
                            <span className="text-white font-semibold text-right tabular-nums">
                              {formatPrice(
                                bookingDisplayTotalCents,
                                paymentCurrency,
                                bookingFlowLocale
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white font-semibold text-right tabular-nums">
                            {formatPrice(
                              totalPriceCents,
                              paymentCurrency,
                              bookingFlowLocale
                            )}
                          </span>
                        )}
                      </div>
                      {saleAppliesLine ? (
                        <div className="space-y-1.5">
                          <BookingSaleAppliesNotice line={saleAppliesLine} />
                          {bookingDiscountPricing.discountCents > 0 ? (
                            <p className="text-sm font-medium text-emerald-300/90">
                              {ui.common.youSave(
                                formatPrice(
                                  bookingDiscountPricing.discountCents,
                                  paymentCurrency,
                                  bookingFlowLocale
                                )
                              )}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      {requiresDepositNow && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-gray-300 shrink-0">
                            {depositIsPercent && depositPercentWhole != null
                              ? ui.common.depositPercentOfTotal(
                                  depositPercentWhole
                                )
                              : ui.common.deposit}
                          </span>
                          <span className="text-white font-semibold text-right tabular-nums">
                            {formatPrice(
                              configuredDepositCents,
                              paymentCurrency,
                              bookingFlowLocale
                            )}
                          </span>
                        </div>
                      )}
                      {(requiresPayNow || requiresDepositNow) && (
                        <>
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-gray-300 shrink-0">
                              {ui.common.dueNow}
                            </span>
                            <span className="text-white font-semibold text-right tabular-nums">
                              {formatPrice(
                                amountDueNowCents,
                                paymentCurrency,
                                bookingFlowLocale
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-gray-300 shrink-0">
                              {ui.common.remaining}
                            </span>
                            <span className="text-white font-semibold text-right tabular-nums">
                              {formatPrice(
                                amountDueLaterCents,
                                paymentCurrency,
                                bookingFlowLocale
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {amountDueNowCents > 0 && (
                    <p className="text-xs text-gray-400 text-center px-1">
                      {ui.calendar.stripeLeaveNotice}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Sticky bottom CTA — high z-index + touch-manipulation avoid taps being eaten on mobile */}
        <div
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm p-4 safe-area-pb touch-manipulation"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div
            className={`max-w-2xl mx-auto ${
              isOwnerManualBooking ? 'grid grid-cols-2 gap-3' : ''
            }`}
          >
            {isOwnerManualBooking && step === 'location' ? (
              <Button
                href={exitCalendarFlowHref}
                variant="secondary"
                fullWidth
                className="font-semibold"
              >
                {ui.common.back}
              </Button>
            ) : null}
            {isOwnerManualBooking && step === 'schedule' ? (
              needsInlineLocationStep ? (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  className="font-semibold"
                  onClick={() => setStep('location')}
                >
                  {ui.common.back}
                </Button>
              ) : (
                <Button
                  href={exitCalendarFlowHref}
                  variant="secondary"
                  fullWidth
                  className="font-semibold"
                >
                  {ui.common.back}
                </Button>
              )
            ) : null}
            {isOwnerManualBooking && step === 'details' ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="font-semibold"
                onClick={handleDetailsBack}
              >
                {ui.common.back}
              </Button>
            ) : null}
            {isOwnerManualBooking && step === 'review' ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="font-semibold"
                onClick={openDetailsFromReview}
              >
                {ui.common.back}
              </Button>
            ) : null}
            {isOwnerManualBooking && step === 'payment' ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="font-semibold"
                onClick={() => setStep('review')}
              >
                {ui.common.back}
              </Button>
            ) : null}
            {step === 'location' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canContinueFromLocation}
                onClick={openScheduleFromLocation}
              >
                {ui.common.continue}
              </Button>
            )}
            {step === 'schedule' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canContinueFromSchedule}
                onClick={continueFromSchedule}
              >
                {ui.common.continue}
              </Button>
            )}
            {step === 'details' && (
              <Button
                key={`details-form-${detailsSubStep}`}
                // When vehicles are incomplete, stay clickable as a button so we
                // can toast the next step instead of a silent disabled state.
                type={multiJobAssetsIncomplete ? 'button' : 'submit'}
                form={CUSTOMER_FORM_ID}
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!detailsFormValid}
                onClick={
                  multiJobAssetsIncomplete
                    ? toastMultiJobAssetRequired
                    : undefined
                }
              >
                {detailsPrimaryCtaLabel}
              </Button>
            )}
            {step === 'review' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={isSubmitting}
                onClick={() => {
                  if (shouldShowPaymentStep) setStep('payment');
                  else void handleConfirmBooking();
                }}
              >
                {shouldShowPaymentStep
                  ? ui.calendar.continueToPayment
                  : ui.calendar.confirmBooking}
              </Button>
            )}
            {step === 'payment' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold touch-manipulation min-h-[52px]"
                disabled={!canContinueFromPayment}
                loading={isSubmitting}
                onClick={() => {
                  const cents = amountDueNowCents;
                  logBookingCheckoutDev('payment primary CTA clicked', {
                    cents,
                    action:
                      cents > 0 ? 'stripe_checkout' : 'confirm_booking_only',
                    ctaLabel: paymentStepCtaLabel,
                  });
                  if (cents > 0) void handleStartCheckout(cents);
                  else {
                    logBookingCheckoutDev(
                      'payment CTA: no online amount due — creating booking without checkout',
                      { cents }
                    );
                    void handleConfirmBooking();
                  }
                }}
              >
                {isSubmitting ? paymentPrimaryBusyLabel : paymentStepCtaLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
