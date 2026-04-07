'use client';

import {
  Button,
  GlassCard,
  Input,
  PriceInput,
  TextArea,
  TimeSelect,
  WarningCallout,
} from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import {
  isValidServiceEditDurationInput,
  parseServiceEditDurationForSave,
  SERVICE_EDIT_DURATION_ERROR,
} from '@/features/services/utils/serviceEditForm';
import { useOwnerQuoteScheduling } from '@/features/quotes/hooks/useOwnerQuoteScheduling';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

export type CreateQuoteScreenProps = {
  businessSlug: string | null;
};

type Step = 'details' | 'schedule' | 'review' | 'sent';

function getTodayAtMidnight() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function formatCurrencyFromDigits(digits: string): string {
  if (!digits) return '—';
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}

function formatReviewDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Minimal RFC-style check for sending quote links. */
function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export const CreateQuoteScreen: React.FC<CreateQuoteScreenProps> = ({
  businessSlug,
}) => {
  const [step, setStep] = useState<Step>('details');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [priceDigits, setPriceDigits] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('01:00');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const durationMinutes = useMemo(() => {
    const r = parseServiceEditDurationForSave(durationHHmm);
    return r.ok ? r.durationMinutes : 60;
  }, [durationHHmm]);

  const {
    weeklySchedule,
    timeOffBlocks,
    loading: scheduleDataLoading,
    hasSavedAvailability,
  } = useOwnerQuoteScheduling();

  const { blockedSlots, loading: blockedLoading } = usePublicBlockedSlots(
    businessSlug ?? undefined
  );

  useEffect(() => {
    setSelectedDate(null);
    setSelectedTime(null);
  }, [durationHHmm]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const canProceedDetails = useMemo(() => {
    return (
      customerName.trim().length > 0 &&
      isValidEmail(customerEmail) &&
      serviceName.trim().length > 0 &&
      priceDigits.trim().length > 0 &&
      isValidServiceEditDurationInput(durationHHmm)
    );
  }, [customerEmail, customerName, durationHHmm, priceDigits, serviceName]);

  const canProceedSchedule = selectedDate !== null && selectedTime !== null;

  const canSend = canProceedDetails && canProceedSchedule;

  const handleSelectDate = (d: Date) => {
    setSelectedDate(d);
    setSelectedTime(null);
  };

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 pb-32 pt-6 sm:px-6 sm:pb-32 sm:pt-8 lg:px-8 lg:pt-10">
        {step === 'details' ? (
          <header className="mb-6 sm:mb-8">
            <Link
              href={ROUTES.DASHBOARD.MAIN}
              className="group -ml-1 mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
              Dashboard
            </Link>
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              New Quote
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-gray-500">
              Add details, pick a time, and send your customer an approval link.
            </p>
            <div className="mt-4 h-px w-full bg-white/10" aria-hidden />
          </header>
        ) : null}

        {step === 'details' && (
          <GlassCard
            padding="md"
            rounded="rounded-2xl"
            blurColor="bg-zinc-500"
            showBlur={true}
            className="w-full"
          >
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Customer
              </p>
              <Input
                label="Name"
                placeholder="e.g. Jordan Lee"
                value={customerName}
                onChange={setCustomerName}
                required
                autoComplete="name"
              />
              <Input
                label="Email"
                placeholder="customer@email.com"
                value={customerEmail}
                onChange={setCustomerEmail}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                error={
                  customerEmail.trim().length > 0 &&
                  !isValidEmail(customerEmail)
                    ? 'Enter a valid email address'
                    : undefined
                }
              />

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">
                Service
              </p>
              <Input
                label="Service name"
                placeholder='e.g. "3 Muddy Razors"'
                value={serviceName}
                onChange={setServiceName}
                required
              />

              <PriceInput
                label="Price"
                placeholder="e.g. $600"
                value={priceDigits}
                onChange={setPriceDigits}
                required
              />

              <div className="min-w-0">
                <span className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                  Duration
                  <span className="ml-1 text-red-400">*</span>
                </span>
                <TimeSelect
                  variant="duration"
                  value={durationHHmm}
                  onChange={setDurationHHmm}
                  durationPlaceholder="Select duration"
                />
                {durationHHmm.trim().length > 0 &&
                !parseServiceEditDurationForSave(durationHHmm).ok ? (
                  <p className="mt-1.5 text-sm text-red-400">
                    {SERVICE_EDIT_DURATION_ERROR}
                  </p>
                ) : null}
              </div>

              <TextArea
                label="Note (optional)"
                placeholder='e.g. "Clay bar included"'
                value={note}
                onChange={setNote}
                rows={3}
                maxLength={500}
              />
            </div>
          </GlassCard>
        )}

        {step === 'schedule' && (
          <GlassCard
            padding="md"
            rounded="rounded-2xl"
            blurColor="bg-zinc-500"
            showBlur={true}
            className="w-full"
          >
            <div className="space-y-6 pt-1">
              {!hasSavedAvailability && (
                <WarningCallout>
                  We don&apos;t see a saved weekly schedule yet. Showing default
                  hours for slot suggestions —{' '}
                  <a
                    href={ROUTES.DASHBOARD.AVAILABILITY}
                    className="underline text-amber-200 hover:text-white"
                  >
                    set availability
                  </a>{' '}
                  for accurate open times.
                </WarningCallout>
              )}

              {!businessSlug?.trim() && (
                <WarningCallout>
                  Add a public profile link to load your existing bookings into
                  this picker and avoid double-booking.
                </WarningCallout>
              )}

              {(scheduleDataLoading || blockedLoading) && (
                <p className="text-sm text-gray-400">Loading schedule…</p>
              )}

              <DateSelector
                weeklySchedule={weeklySchedule}
                serviceDurationMinutes={durationMinutes}
                existingBookings={blockedSlots}
                timeOffBlocks={timeOffBlocks}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                minDate={getTodayAtMidnight()}
                plainCalendar
              />
              <TimeSlotGrid
                selectedDate={selectedDate}
                serviceDurationMinutes={durationMinutes}
                weeklySchedule={weeklySchedule}
                existingBookings={blockedSlots}
                timeOffBlocks={timeOffBlocks}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            </div>
          </GlassCard>
        )}

        {step === 'review' && selectedDate && selectedTime && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Review quote
              </h2>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-sm font-medium text-zinc-400 underline underline-offset-4 transition-colors hover:text-white"
              >
                Edit
              </button>
            </div>
            <GlassCard
              padding="md"
              rounded="rounded-2xl"
              blurColor="bg-zinc-500"
              showBlur={true}
              className="w-full"
            >
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Service
                  </p>
                  <p className="font-medium text-white">{serviceName.trim()}</p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    {formatCurrencyFromDigits(priceDigits)} •{' '}
                    {formatDurationMinutes(durationMinutes)}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Date &amp; time
                  </p>
                  <p className="font-medium text-white">
                    {formatReviewDate(selectedDate)}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    Starts {formatTime12(selectedTime)}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Customer
                  </p>
                  <p className="font-medium text-white">{customerName.trim()}</p>
                  <p className="break-words text-sm text-gray-400">
                    {customerEmail.trim()}
                  </p>
                </div>

                {note.trim().length > 0 && (
                  <div>
                    <p className="mb-1 text-xs tracking-wider text-gray-500">
                      Note
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-gray-400">
                      {note.trim()}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {step === 'sent' && selectedDate && selectedTime && (
          <div className="flex w-full flex-col py-6 pb-14">
            <div className="mb-7 flex h-20 w-20 self-center items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <CheckIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-2 text-center text-2xl font-bold text-white">
              Quote sent
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-center text-sm text-gray-400">
              The quote has been emailed to your customer. They can review the
              details and accept or decline directly from the link.
            </p>
            <GlassCard
              padding="none"
              rounded="rounded-2xl"
              blurColor="bg-emerald-500"
              showBlur={true}
              className="mb-7 w-full"
            >
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Quote summary
                </p>
              </div>
              <div className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">Service</p>
                  <p className="font-semibold text-white">{serviceName.trim()}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatCurrencyFromDigits(priceDigits)} •{' '}
                    {formatDurationMinutes(durationMinutes)}
                  </p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-white">{customerName.trim()}</p>
                  <p className="break-words text-sm text-gray-400">
                    {customerEmail.trim()}
                  </p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">Date &amp; time</p>
                  <p className="font-medium text-white">
                    {formatReviewDate(selectedDate)}
                  </p>
                  <p className="text-sm text-gray-400">
                    Starts {formatTime12(selectedTime)}
                  </p>
                </div>
                {note.trim().length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-0.5 text-xs text-gray-500">Note</p>
                      <p className="whitespace-pre-wrap text-sm text-gray-400">
                        {note.trim()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
            <Link
              href={ROUTES.DASHBOARD.MAIN}
              className="inline-flex min-h-[48px] items-center justify-center self-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
            >
              Back to dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Match public booking flow: sticky bottom bar + inverse primary (see AvailabilityBookingPage) */}
      {step !== 'sent' ? (
        <div
          className="safe-area-pb fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm lg:left-64"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto w-full max-w-3xl min-w-0 px-0 sm:px-0">
            {step === 'details' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canProceedDetails}
                onClick={() => setStep('schedule')}
              >
                Choose date &amp; time
              </Button>
            )}
            {step === 'schedule' && (
              <div className="flex items-stretch gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 self-auto px-5"
                  onClick={() => setStep('details')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="inverse"
                  size="sm"
                  className="min-w-0 flex-1 font-semibold"
                  disabled={!canProceedSchedule}
                  onClick={() => setStep('review')}
                >
                  Review quote
                </Button>
              </div>
            )}
            {step === 'review' && selectedDate && selectedTime && (
              <div className="flex items-stretch gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 self-auto px-5"
                  onClick={() => setStep('schedule')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="inverse"
                  size="sm"
                  className="min-w-0 flex-1 font-semibold"
                  disabled={!canSend}
                  onClick={() => setStep('sent')}
                >
                  Send quote
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default CreateQuoteScreen;
