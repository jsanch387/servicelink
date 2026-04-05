'use client';

import {
  Button,
  GlassCard,
  Input,
  PriceInput,
  Select,
  TextArea,
  WarningCallout,
} from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import { QUOTE_DURATION_OPTIONS } from '@/features/quotes/constants/quoteDurationOptions';
import { useOwnerQuoteScheduling } from '@/features/quotes/hooks/useOwnerQuoteScheduling';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

export type CreateQuoteScreenProps = {
  businessSlug: string | null;
};

type Step = 'details' | 'schedule' | 'review';

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

function durationLabel(minutes: number): string {
  const opt = QUOTE_DURATION_OPTIONS.find(
    o => parseInt(o.value, 10) === minutes
  );
  return opt?.label ?? `${minutes} minutes`;
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
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [priceDigits, setPriceDigits] = useState('');
  const [durationMinutesStr, setDurationMinutesStr] = useState('60');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const durationMinutes = parseInt(durationMinutesStr, 10) || 60;

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
  }, [durationMinutesStr]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const canProceedDetails = useMemo(() => {
    return (
      clientName.trim().length > 0 &&
      isValidEmail(clientEmail) &&
      serviceName.trim().length > 0 &&
      priceDigits.trim().length > 0 &&
      durationMinutesStr.trim().length > 0
    );
  }, [clientEmail, clientName, durationMinutesStr, priceDigits, serviceName]);

  const canProceedSchedule = selectedDate !== null && selectedTime !== null;

  const canSend = canProceedDetails && canProceedSchedule;

  const handleSelectDate = (d: Date) => {
    setSelectedDate(d);
    setSelectedTime(null);
  };

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 pb-32 pt-6 sm:px-6 sm:pb-32 sm:pt-8 lg:px-8 lg:pt-10">
        <header className="mb-8 border-b border-white/10 pb-8 sm:mb-10 sm:pb-10">
          <Link
            href={ROUTES.DASHBOARD.MAIN}
            className="group -ml-1 mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
            Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            New Quote
          </h1>
        </header>

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
                Client
              </p>
              <Input
                label="Client name"
                placeholder="e.g. Jordan Lee"
                value={clientName}
                onChange={setClientName}
                required
                autoComplete="name"
              />
              <Input
                label="Client email"
                placeholder="client@email.com"
                value={clientEmail}
                onChange={setClientEmail}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                error={
                  clientEmail.trim().length > 0 && !isValidEmail(clientEmail)
                    ? 'Enter a valid email address'
                    : undefined
                }
              />
              <p className="text-xs text-gray-500 -mt-3">
                We’ll send the quote approval link to this address.
              </p>

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">
                Work &amp; value
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

              <Select
                label="Duration"
                value={durationMinutesStr}
                onChange={setDurationMinutesStr}
                options={QUOTE_DURATION_OPTIONS.map(o => ({
                  value: o.value,
                  label: o.label,
                }))}
                placeholder="Select duration"
                required
              />

              <p className="text-xs text-gray-500 leading-relaxed">
                Duration protects your calendar: we only offer start times where
                the full job fits and doesn’t overlap bookings.
              </p>

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
          <div className="space-y-6 pt-4">
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
        )}

        {step === 'review' && selectedDate && selectedTime && (
          <GlassCard
            padding="md"
            rounded="rounded-2xl"
            blurColor="bg-zinc-500"
            showBlur={true}
            className="w-full"
          >
            <div className="space-y-6">
              <dl className="divide-y divide-white/10">
                <div className="py-4 first:pt-0">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Client name
                  </dt>
                  <dd className="text-left text-base font-medium text-white">
                    {clientName.trim()}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Client email
                  </dt>
                  <dd className="break-words text-left text-base font-medium text-white">
                    {clientEmail.trim()}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Service name
                  </dt>
                  <dd className="text-left text-base font-medium text-white">
                    {serviceName.trim()}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Price
                  </dt>
                  <dd className="text-left text-base font-medium text-white">
                    {formatCurrencyFromDigits(priceDigits)}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Duration
                  </dt>
                  <dd className="text-left text-base font-medium text-white">
                    {durationLabel(durationMinutes)}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Date &amp; time
                  </dt>
                  <dd className="text-left text-base font-medium text-white">
                    {formatReviewDate(selectedDate)}
                    <div className="mt-1 text-sm font-normal text-zinc-400">
                      Starts {formatTime12(selectedTime)}
                    </div>
                  </dd>
                </div>
                {note.trim().length > 0 && (
                  <div className="py-4">
                    <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Note
                    </dt>
                    <dd className="whitespace-pre-wrap text-left text-base font-medium leading-relaxed text-white">
                      {note.trim()}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-left text-sm font-medium text-zinc-500 transition-colors hover:text-white"
                >
                  Edit quote details
                </button>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Match public booking flow: sticky bottom bar + inverse primary (see AvailabilityBookingPage) */}
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
              >
                Send to client (SMS / Email)
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default CreateQuoteScreen;
