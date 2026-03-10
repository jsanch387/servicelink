'use client';

import { Button } from '@/components/shared';
import { useEffect, useMemo, useState } from 'react';
import { usePublicBlockedSlots } from '../hooks/usePublicBlockedSlots';
import type {
  AddOnDisplay,
  AvailabilityBookingPageProps,
  CustomerFormData,
} from '../types';
import { formatDurationMinutes } from '../utils/formatDuration';
import { INITIAL_CUSTOMER_FORM_DATA } from '../utils/initialFormData';
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

export function AvailabilityBookingPage({
  businessName,
  businessId,
  businessSlug,
  serviceId,
  addOnIds,
  selectedAddOns: selectedAddOnsProp,
  serviceName,
  serviceDurationMinutes = 60,
  servicePriceCents,
  weeklySchedule,
  existingBookings: existingBookingsProp,
}: AvailabilityBookingPageProps) {
  const { blockedSlots } = usePublicBlockedSlots(businessSlug);
  const existingBookings = existingBookingsProp ?? blockedSlots;

  // Use server-resolved add-ons when provided; otherwise fall back to empty (addOnIds alone can't resolve without a fetch)
  const selectedAddOns: AddOnDisplay[] = selectedAddOnsProp ?? [];

  const totalPriceCents = useMemo(() => {
    const base = servicePriceCents ?? 0;
    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0);
    return base + addOnTotal;
  }, [servicePriceCents, selectedAddOns]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  const canContinueFromDetails = isCustomerFormValid(customerData);

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
          servicePriceCents: servicePriceCents ?? undefined,
          durationMinutes: serviceDurationMinutes,
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
        selectedAddOns={submittedData.selectedAddOns}
        totalPriceCents={totalPriceCents}
        date={submittedData.date}
        time={submittedData.time}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[60vh]">
      <div className="flex-1 pb-28">
        {/* Step 1 – Schedule */}
        {step === 1 && (
          <div className="space-y-6 pt-4">
            <section>
              <h2 className="text-lg font-semibold text-white mb-1">
                {serviceName || 'Booking'}
              </h2>
              <p className="text-sm text-gray-400">
                {formatDurationMinutes(serviceDurationMinutes)}
                {servicePriceCents != null && (
                  <> · ${(servicePriceCents / 100).toFixed(2)}</>
                )}
              </p>
            </section>
            <DateSelector
              weeklySchedule={weeklySchedule}
              selectedDate={selectedDate}
              onSelectDate={date => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
            />
            <TimeSlotGrid
              selectedDate={selectedDate}
              serviceDurationMinutes={serviceDurationMinutes}
              weeklySchedule={weeklySchedule}
              existingBookings={existingBookings}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />
          </div>
        )}

        {/* Step 2 – Details */}
        {step === 2 && (
          <div className="pt-4">
            <CustomerForm
              id={CUSTOMER_FORM_ID}
              value={customerData}
              onChange={setCustomerData}
              onSubmit={() => setStep(3)}
              hideSubmitButton
              submitLabel="Review Booking"
            />
          </div>
        )}

        {/* Step 3 – Confirm */}
        {step === 3 && selectedDate && selectedTime && (
          <div className="pt-4 space-y-4">
            {submitError && (
              <p className="text-sm text-red-400" role="alert">
                {submitError}
              </p>
            )}
            <BookingSummary
              serviceName={serviceName}
              serviceDurationMinutes={serviceDurationMinutes}
              servicePriceCents={servicePriceCents}
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
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {(step === 2 || step === 3) && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="font-semibold shrink-0"
              onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
            >
              Back
            </Button>
          )}
          {step === 1 && (
            <Button
              type="button"
              variant="inverse"
              size="lg"
              fullWidth
              className="font-semibold"
              disabled={!canContinueFromSchedule}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          )}
          {step === 2 && (
            <Button
              type="submit"
              form={CUSTOMER_FORM_ID}
              variant="inverse"
              size="lg"
              className="flex-1 font-semibold"
              disabled={!canContinueFromDetails}
            >
              Review Booking
            </Button>
          )}
          {step === 3 && (
            <Button
              type="button"
              variant="inverse"
              size="lg"
              className="flex-1 font-semibold"
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
