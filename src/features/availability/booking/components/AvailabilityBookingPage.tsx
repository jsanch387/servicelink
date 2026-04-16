'use client';

import { Button } from '@/components/shared';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useEffect, useId, useMemo, useState } from 'react';
import { usePublicBlockedSlots } from '../hooks/usePublicBlockedSlots';
import type {
  AddOnDisplay,
  AvailabilityBookingPageProps,
  CustomerFormData,
  PublicBookingPaymentSettings,
} from '../types';
import { INITIAL_CUSTOMER_FORM_DATA } from '../utils/initialFormData';
import { BookingPriceBreakdown } from './BookingPriceBreakdown';
import { BookingSuccess } from './BookingSuccess';
import { BookingSummary } from './BookingSummary';
import { CustomerForm, isCustomerFormValid } from './CustomerForm';
import { DateSelector } from './DateSelector';
import { TimeSlotGrid } from './TimeSlotGrid';

function formatTimeDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const CUSTOMER_FORM_ID = 'availability-booking-details-form';

/** Sub-steps inside `/book` after service options/add-ons (calendar → form → review). */
export type CalendarBookingStep = 'schedule' | 'details' | 'review' | 'payment';

type PaymentChoice = 'pay_now' | 'pay_in_person';

function formatPrice(cents: number, currency: string): string {
  const amount = Number.isFinite(cents) ? Math.max(0, cents) : 0;
  const safeCurrency = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat('en-US', {
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
}: AvailabilityBookingPageProps) {
  const { blockedSlots } = usePublicBlockedSlots(businessSlug);
  const existingBookings = existingBookingsProp ?? blockedSlots;

  // Use server-resolved add-ons when provided; otherwise fall back to empty (addOnIds alone can't resolve without a fetch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedAddOns: AddOnDisplay[] = selectedAddOnsProp ?? [];

  const totalPriceCents = useMemo(() => {
    const base = servicePriceCents ?? 0;
    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0);
    return base + addOnTotal;
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
  const [customerPaymentChoice, setCustomerPaymentChoice] =
    useState<PaymentChoice | null>(null);

  const paymentSettingsEnabled =
    paymentSettings?.paymentsEnabled === true && !isOwnerManualBooking;
  const shouldShowPaymentStep = paymentSettingsEnabled;
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
  const amountDueNowCents = requiresPayNow
    ? totalPriceCents
    : requiresDepositNow
      ? configuredDepositCents
      : 0;
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
      return 'Choose how to pay';
    }
    if (amountDueNowCents <= 0) return 'Confirm Booking';
    const amt = formatPrice(amountDueNowCents, paymentCurrency);
    if (requiresPayNow && amountDueNowCents >= totalPriceCents) {
      return `Pay ${amt}`;
    }
    if (requiresDepositNow && amountDueNowCents < totalPriceCents) {
      return `Pay ${amt} deposit`;
    }
    return `Pay ${amt}`;
  }, [
    amountDueNowCents,
    totalPriceCents,
    requiresPayNow,
    requiresDepositNow,
    paymentCurrency,
    paymentSettings?.checkoutMode,
    customerPaymentChoice,
  ]);

  const canContinueFromSchedule = Boolean(selectedDate && selectedTime);
  const canContinueFromDetails = isCustomerFormValid(
    customerData,
    showVehicleFields
  );
  const canContinueFromPayment =
    !isSubmitting &&
    (paymentSettings?.checkoutMode !== 'customer_choice' ||
      customerPaymentChoice !== null);

  useEffect(() => {
    if (!paymentSettingsEnabled) {
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
  }, [paymentSettings?.checkoutMode, paymentSettingsEnabled]);

  // Scroll to top when step changes so user sees the top of the form (especially on mobile)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const scheduledDate = selectedDate.toISOString().slice(0, 10);
    try {
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
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? 'Something went wrong');
        return;
      }
      setSubmittedData({
        date: scheduledDate,
        time: formatTimeDisplay(selectedTime),
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
      />
    );
  }

  const headerClassName =
    'inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors';

  return (
    <div className="flex flex-col min-h-[60vh]">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-2 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto">
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
              <span className="text-sm font-medium">Back to date & time</span>
            </button>
          )}
          {step === 'review' && (
            <button
              type="button"
              onClick={() => setStep('details')}
              className={headerClassName}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Back to details</span>
            </button>
          )}
          {step === 'payment' && (
            <button
              type="button"
              onClick={() => setStep('review')}
              className={headerClassName}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Back to review</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 pb-28">
        {/* Step 1 – Schedule */}
        {step === 'schedule' && (
          <div className="space-y-6 pt-4">
            <BookingPriceBreakdown
              serviceName={serviceName}
              serviceDurationMinutes={serviceDurationMinutes}
              servicePriceCents={servicePriceCents}
              serviceVariantLabel={selectedPriceOptionLabel}
              selectedAddOns={selectedAddOns}
              totalBookingDurationMinutes={totalBookingDurationMinutes}
              totalPriceCents={totalPriceCents}
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
            />
          </div>
        )}

        {/* Step 2 – Details */}
        {step === 'details' && (
          <div className="pt-4">
            <CustomerForm
              id={CUSTOMER_FORM_ID}
              value={customerData}
              onChange={setCustomerData}
              onSubmit={() => setStep('review')}
              showVehicleFields={showVehicleFields}
              hideSubmitButton
              submitLabel="Review Booking"
            />
          </div>
        )}

        {/* Step 3 – Confirm */}
        {step === 'review' && selectedDate && selectedTime && (
          <div className="pt-4 space-y-4">
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
              time={formatTimeDisplay(selectedTime)}
              customer={customerData}
            />
          </div>
        )}

        {step === 'payment' && selectedDate && selectedTime && (
          <div className="pt-4 space-y-5">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Payment
            </h2>

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
                        {depositIsPercent && depositPercentWhole != null ? (
                          <>
                            <span className="font-semibold text-white">
                              {businessName}
                            </span>{' '}
                            requires{' '}
                            <span className="font-semibold text-white">
                              {depositPercentWhole}%
                            </span>{' '}
                            of the total cost as a deposit to book this
                            appointment. This deposit is non-refundable.
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-white">
                              {businessName}
                            </span>{' '}
                            requires a{' '}
                            <span className="font-semibold text-white">
                              {formatPrice(
                                configuredDepositCents,
                                paymentCurrency
                              )}
                            </span>{' '}
                            deposit to book this appointment. This deposit is
                            non-refundable.
                          </>
                        )}
                      </p>
                    ) : (
                      <p
                        id={paymentChoiceGroupDescId}
                        className="text-sm text-gray-300 leading-relaxed"
                      >
                        {paymentSettings?.checkoutMode === 'in_app' && (
                          <>
                            <span className="font-semibold text-white">
                              {businessName}
                            </span>{' '}
                            asks you to pay in full by card to confirm this
                            booking.
                          </>
                        )}
                        {paymentSettings?.checkoutMode === 'in_person' && (
                          <>
                            <span className="font-semibold text-white">
                              {businessName}
                            </span>{' '}
                            collects payment when you meet—nothing is charged
                            here today.
                          </>
                        )}
                        {paymentSettings?.checkoutMode == null && (
                          <>
                            Payment options for{' '}
                            <span className="font-semibold text-white">
                              {businessName}
                            </span>{' '}
                            are not fully set up yet. You will not be charged
                            here today.
                          </>
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
                      How do you want to pay?
                    </p>
                    <BookingPaymentOptionButton
                      selected={customerPaymentChoice === 'pay_now'}
                      onSelect={() => setCustomerPaymentChoice('pay_now')}
                      title="Pay with card"
                      description={
                        requiresDepositNow
                          ? 'Pay the full total now by card (your deposit is included).'
                          : 'Pay the full total by card in ServiceLink.'
                      }
                    />
                    <BookingPaymentOptionButton
                      selected={customerPaymentChoice === 'pay_in_person'}
                      onSelect={() => setCustomerPaymentChoice('pay_in_person')}
                      title="Pay in person"
                      description={
                        requiresDepositNow
                          ? 'Pay the deposit by card now to book. Pay the rest when you meet your provider.'
                          : 'Pay when you meet your provider—nothing charged here today.'
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
                          ? 'Pay the deposit with your card on the next step. Pay the remaining balance in person when you meet your provider.'
                          : 'Bring payment when you meet your provider.'}
                      </p>
                    )}

                    {paymentSettings?.checkoutMode === 'in_app' && (
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {requiresDepositNow
                          ? 'The amount due now includes your deposit and confirms your spot.'
                          : 'The full booking total is due by card to confirm your spot.'}
                      </p>
                    )}

                    {paymentSettings?.checkoutMode == null && (
                      <p className="text-sm text-gray-400 leading-relaxed">
                        You can still continue; card checkout will be available
                        once this business finishes payment setup.
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                  <p className="text-sm font-semibold text-white tracking-tight pb-3 border-b border-white/10">
                    Summary
                  </p>
                  <div className="flex flex-col gap-3.5 pt-4">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-gray-300 shrink-0">
                        Booking total
                      </span>
                      <span className="text-white font-semibold text-right tabular-nums">
                        {formatPrice(totalPriceCents, paymentCurrency)}
                      </span>
                    </div>
                    {requiresDepositNow && (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-gray-300 shrink-0">
                          {depositIsPercent && depositPercentWhole != null
                            ? `Deposit (${depositPercentWhole}% of total)`
                            : 'Deposit'}
                        </span>
                        <span className="text-white font-semibold text-right tabular-nums">
                          {formatPrice(configuredDepositCents, paymentCurrency)}
                        </span>
                      </div>
                    )}
                    {(requiresPayNow || requiresDepositNow) && (
                      <>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-gray-300 shrink-0">
                            Due now
                          </span>
                          <span className="text-white font-semibold text-right tabular-nums">
                            {formatPrice(amountDueNowCents, paymentCurrency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-gray-300 shrink-0">
                            Remaining
                          </span>
                          <span className="text-white font-semibold text-right tabular-nums">
                            {formatPrice(amountDueLaterCents, paymentCurrency)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center px-1">
                  Preview: checkout is not live yet—no charge will run.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm p-4 safe-area-pb"
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
              Continue
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
              Review Booking
            </Button>
          )}
          {step === 'review' && (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              className="font-semibold"
              disabled={isSubmitting}
              onClick={() =>
                shouldShowPaymentStep
                  ? setStep('payment')
                  : handleConfirmBooking()
              }
            >
              {shouldShowPaymentStep
                ? 'Continue to payment'
                : 'Confirm Booking'}
            </Button>
          )}
          {step === 'payment' && (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              className="font-semibold"
              disabled={!canContinueFromPayment}
              onClick={handleConfirmBooking}
            >
              {isSubmitting
                ? amountDueNowCents > 0
                  ? 'Processing payment…'
                  : 'Saving…'
                : paymentStepCtaLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
