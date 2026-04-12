'use client';

import { Button } from '@/components/shared';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePublicBlockedSlots } from '../hooks/usePublicBlockedSlots';
import type {
  AddOnDisplay,
  AvailabilityBookingPageProps,
  CustomerFormData,
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
export type CalendarBookingStep = 'schedule' | 'details' | 'review';

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

  const canContinueFromSchedule = Boolean(selectedDate && selectedTime);
  const canContinueFromDetails = isCustomerFormValid(
    customerData,
    showVehicleFields
  );

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
              onClick={handleConfirmBooking}
            >
              {isSubmitting ? 'Saving…' : 'Confirm Booking'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
