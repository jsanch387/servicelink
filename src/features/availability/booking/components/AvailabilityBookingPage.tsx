'use client';

import { Button, nativeCheckboxSmClassName } from '@/components/shared';
import { API_ROUTES, type PublicBookingFlowLocale } from '@/constants/routes';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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
import { formatBookingWallTime } from '../utils/formatBookingWallTime';
import { INITIAL_CUSTOMER_FORM_DATA } from '../utils/initialFormData';
import { publicBookingFlowUserFacingError } from '../utils/publicBookingFlowUserFacingError';
import { BookingPaymentSuccess } from './BookingPaymentSuccess';
import { BookingPriceBreakdown } from './BookingPriceBreakdown';
import { BookingSuccess } from './BookingSuccess';
import { BookingSummary } from './BookingSummary';
import { CustomerForm, isCustomerFormValid } from './CustomerForm';
import { DateSelector } from './DateSelector';
import { TimeSlotGrid } from './TimeSlotGrid';

const CUSTOMER_FORM_ID = 'availability-booking-details-form';

const BOOKING_CHECKOUT_RESUME_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Sub-steps inside `/book` after service options/add-ons (calendar → form → review). */
export type CalendarBookingStep = 'schedule' | 'details' | 'review' | 'payment';

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
  serviceId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addOnIds,
  selectedAddOns: selectedAddOnsProp,
  serviceName,
  serviceDurationMinutes = 60,
  servicePriceCents,
  selectedPriceOptionLabel,
  weeklySchedule,
  timeOffBlocks: timeOffBlocksProp = [],
  existingBookings: existingBookingsProp,
  isOwnerManualBooking = false,
  paymentSettings = null,
  exitCalendarFlowHref,
  exitCalendarFlowLabel,
  stripeCheckoutSessionId = null,
  bookingFlowLocale = 'en',
}: AvailabilityBookingPageProps) {
  const ui = useMemo(
    () => publicBookingUi(bookingFlowLocale),
    [bookingFlowLocale]
  );
  const { blockedSlots } = usePublicBlockedSlots(businessSlug);
  const existingBookings = existingBookingsProp ?? blockedSlots;

  // Use server-resolved add-ons when provided; otherwise fall back to empty (addOnIds alone can't resolve without a fetch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedAddOns: AddOnDisplay[] = selectedAddOnsProp ?? [];

  const totalPriceCents = useMemo(() => {
    const base = Number(servicePriceCents);
    const safeBase = Number.isFinite(base) ? Math.max(0, base) : 0;
    const addOnTotal = selectedAddOns.reduce((sum, a) => {
      const p = Number(a.priceCents);
      return sum + (Number.isFinite(p) ? p : 0);
    }, 0);
    const t = safeBase + addOnTotal;
    return Number.isFinite(t) ? t : 0;
  }, [servicePriceCents, selectedAddOns]);

  const totalBookingDurationMinutes = useMemo(() => {
    const addOnMins = selectedAddOns.reduce((sum, a) => {
      const m = a.durationMinutes;
      return sum + (m != null && m > 0 ? m : 0);
    }, 0);
    return serviceDurationMinutes + addOnMins;
  }, [serviceDurationMinutes, selectedAddOns]);

  const [step, setStep] = useState<CalendarBookingStep>('schedule');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerFormData>(
    INITIAL_CUSTOMER_FORM_DATA
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
  /** Public customers only: required before confirm / continue to payment (SMS compliance). */
  const [agreedToPublicNotifications, setAgreedToPublicNotifications] =
    useState(false);
  const [notificationsConsentError, setNotificationsConsentError] = useState<
    string | null
  >(null);
  const notificationsConsentErrorId = useId();

  const router = useRouter();
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
  const amountDueNowCents = computeOnlineAmountDueNowCents(
    paymentSettings,
    paymentSettingsEnabled,
    customerPaymentChoice,
    totalPriceCents
  );
  const amountDueLaterCents = Math.max(0, totalPriceCents - amountDueNowCents);

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
    if (requiresPayNow && amountDueNowCents >= totalPriceCents) {
      return ui.calendar.payAmount(amt);
    }
    if (requiresDepositNow && amountDueNowCents < totalPriceCents) {
      return ui.calendar.payDepositAmount(amt);
    }
    return ui.calendar.payAmount(amt);
  }, [
    amountDueNowCents,
    totalPriceCents,
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
  const canContinueFromDetails = isCustomerFormValid(
    customerData,
    showVehicleFields,
    true
  );
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
    // Always return to review so the customer sees booking summary and notification consent.
    setAgreedToPublicNotifications(false);
    setNotificationsConsentError(null);
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
  ]);

  // Scroll to top when step changes so user sees the top of the form (especially on mobile)
  useEffect(() => {
    if (skipNextStepScrollRef.current) {
      skipNextStepScrollRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  useEffect(() => {
    if (step !== 'details') return;
    setAgreedToPublicNotifications(false);
    setNotificationsConsentError(null);
  }, [step]);

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
    if (!isOwnerManualBooking && !agreedToPublicNotifications) {
      setNotificationsConsentError(ui.calendar.notificationsConsentRequired);
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
    const payload = {
      businessSlug,
      amountCents: Math.round(amountToChargeCents),
      serviceName: serviceName?.trim() || 'Service',
      bookingPayload: selectedDate
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
            scheduledDate: selectedDate.toISOString().slice(0, 10),
            startTime: selectedTime ?? '',
            customer: {
              ...customerData,
            },
            totalPriceCents,
            requiredOnlineAmountCents: Math.round(amountToChargeCents),
            paymentMethodSelected: customerPaymentChoice ?? 'none',
            depositType: requiresDepositNow
              ? (paymentSettings?.depositType ?? null)
              : null,
            depositValue: requiresDepositNow
              ? (paymentSettings?.depositValue ?? null)
              : null,
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
    if (!isOwnerManualBooking && !agreedToPublicNotifications) {
      setNotificationsConsentError(ui.calendar.notificationsConsentRequired);
      return;
    }
    setSubmitError(null);
    setNotificationsConsentError(null);
    setIsSubmitting(true);
    const scheduledDate = selectedDate.toISOString().slice(0, 10);
    try {
      const paymentMethodForPublicCreate =
        shouldShowPaymentStep && customerPaymentChoice === 'pay_in_person'
          ? ('pay_in_person' as const)
          : ('none' as const);

      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          customer: customerData,
          paymentMethodSelected: paymentMethodForPublicCreate,
          ...(isOwnerManualBooking ? { ownerManualBooking: true } : {}),
        }),
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
      setSubmittedData({
        date: scheduledDate,
        time: formatBookingWallTime(selectedTime, bookingFlowLocale),
        customer: customerData,
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
        serviceName={serviceName}
        serviceVariantLabel={selectedPriceOptionLabel}
        servicePriceCents={servicePriceCents}
        selectedAddOns={submittedData.selectedAddOns}
        totalPriceCents={totalPriceCents}
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

  const headerClassName =
    'inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors';

  return (
    <>
      {/* Match ServiceDetailsScreen: full-width sticky bar; back row uses max-w-2xl + page gutters. */}
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          {step === 'schedule' && (
            <Link href={exitCalendarFlowHref} className={headerClassName}>
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {exitCalendarFlowLabel}
              </span>
            </Link>
          )}
          {step === 'details' && (
            <button
              type="button"
              onClick={() => setStep('schedule')}
              className={headerClassName}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {ui.nav.backToDateTime}
              </span>
            </button>
          )}
          {step === 'review' && (
            <button
              type="button"
              onClick={() => setStep('details')}
              className={headerClassName}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {ui.nav.backToDetails}
              </span>
            </button>
          )}
          {step === 'payment' && (
            <button
              type="button"
              onClick={() => setStep('review')}
              className={headerClassName}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{ui.nav.backToReview}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col min-h-[60vh] max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-24 w-full">
        <div className="flex-1 pb-28">
          {/* Step 1 – Schedule */}
          {step === 'schedule' && (
            <div className="space-y-6">
              <BookingPriceBreakdown
                serviceName={serviceName}
                serviceDurationMinutes={serviceDurationMinutes}
                servicePriceCents={servicePriceCents}
                serviceVariantLabel={selectedPriceOptionLabel}
                selectedAddOns={selectedAddOns}
                totalBookingDurationMinutes={totalBookingDurationMinutes}
                totalPriceCents={totalPriceCents}
                bookingFlowLocale={bookingFlowLocale}
              />
              <DateSelector
                weeklySchedule={weeklySchedule}
                serviceDurationMinutes={totalBookingDurationMinutes}
                existingBookings={existingBookings}
                timeOffBlocks={timeOffBlocksProp}
                selectedDate={selectedDate}
                onSelectDate={date => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
              />
              <TimeSlotGrid
                selectedDate={selectedDate}
                serviceDurationMinutes={totalBookingDurationMinutes}
                weeklySchedule={weeklySchedule}
                existingBookings={existingBookings}
                timeOffBlocks={timeOffBlocksProp}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                heading={ui.calendar.chooseTime}
                selectDateHint={ui.calendar.selectDateHint}
                noSlotsHint={ui.calendar.noSlotsHint}
              />
            </div>
          )}

          {/* Step 2 – Details */}
          {step === 'details' && (
            <div>
              <CustomerForm
                id={CUSTOMER_FORM_ID}
                value={customerData}
                onChange={setCustomerData}
                onSubmit={() => setStep('review')}
                showVehicleFields={showVehicleFields}
                hideSubmitButton
                submitLabel={ui.calendar.reviewBookingCta}
                bookingFlowLocale={bookingFlowLocale}
                emailOptional
              />
            </div>
          )}

          {/* Step 3 – Confirm */}
          {step === 'review' && selectedDate && selectedTime && (
            <div className="space-y-4">
              {submitError && (
                <p className="text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              )}
              <BookingSummary
                serviceName={serviceName}
                serviceDurationMinutes={serviceDurationMinutes}
                totalAppointmentMinutes={totalBookingDurationMinutes}
                servicePriceCents={servicePriceCents}
                serviceVariantLabel={selectedPriceOptionLabel}
                selectedAddOns={selectedAddOns}
                totalPriceCents={totalPriceCents}
                date={selectedDate.toISOString().slice(0, 10)}
                startTimeHhmm={selectedTime}
                customer={customerData}
                bookingFlowLocale={bookingFlowLocale}
              />
              {!isOwnerManualBooking && (
                <div className="space-y-1.5 pt-1">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={agreedToPublicNotifications}
                      onChange={e => {
                        const on = e.target.checked;
                        setAgreedToPublicNotifications(on);
                        if (on) setNotificationsConsentError(null);
                      }}
                      className={`mt-0.5 cursor-pointer ${nativeCheckboxSmClassName}`}
                      aria-invalid={Boolean(notificationsConsentError)}
                      aria-describedby={
                        notificationsConsentError
                          ? notificationsConsentErrorId
                          : undefined
                      }
                    />
                    <span className="text-xs leading-snug text-gray-400">
                      {ui.calendar.notificationsConsentLabel}
                    </span>
                  </label>
                  {notificationsConsentError && (
                    <p
                      id={notificationsConsentErrorId}
                      className="text-xs text-red-400/95 pl-6"
                      role="alert"
                    >
                      {notificationsConsentError}
                    </p>
                  )}
                </div>
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
                        <span className="text-white font-semibold text-right tabular-nums">
                          {formatPrice(
                            totalPriceCents,
                            paymentCurrency,
                            bookingFlowLocale
                          )}
                        </span>
                      </div>
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
          <div className="max-w-2xl mx-auto">
            {step === 'schedule' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canContinueFromSchedule}
                onClick={() => setStep('details')}
              >
                {ui.common.continue}
              </Button>
            )}
            {step === 'details' && (
              <Button
                type="submit"
                form={CUSTOMER_FORM_ID}
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canContinueFromDetails}
              >
                {ui.calendar.reviewBookingCta}
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
                  if (!isOwnerManualBooking && !agreedToPublicNotifications) {
                    setNotificationsConsentError(
                      ui.calendar.notificationsConsentRequired
                    );
                    return;
                  }
                  setNotificationsConsentError(null);
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
                  const cents = computeOnlineAmountDueNowCents(
                    paymentSettings,
                    shouldShowPaymentStep,
                    customerPaymentChoice,
                    totalPriceCents
                  );
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
