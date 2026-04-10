'use client';

import {
  Button,
  GlassCard,
  Input,
  PhoneInput,
  PriceInput,
  TextArea,
  TimeSelect,
  WarningCallout,
  formatUsPhoneDigits,
} from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { useDashboardQuoteDetail } from '@/features/quotes/dashboard/hooks/useDashboardQuoteDetail';
import { isDashboardQuoteEditableByOwner } from '@/features/quotes/dashboard/utils/isDashboardQuoteEditableByOwner';
import {
  centsToWholeDollarDigits,
  durationPickerValueFromQuote,
  parseLocalDateFromYmd,
  pickStartTimeHHmm,
} from '@/features/quotes/dashboard/utils/quoteFormHydrationFromDashboard';
import { useOwnerQuoteScheduling } from '@/features/quotes/hooks/useOwnerQuoteScheduling';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import { QuoteStickyBar } from '@/features/quotes/shared/components/QuoteStickyBar';
import {
  SERVICE_EDIT_DURATION_ERROR,
  isValidServiceEditDurationInput,
  parseServiceEditDurationForSave,
} from '@/features/services/utils/serviceEditForm';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type CreateQuoteScreenProps = {
  businessSlug: string | null;
  mode?: 'create' | 'edit';
  quoteId?: string;
};

type Step = 'details' | 'schedule' | 'review' | 'sent';

function getTodayAtMidnight() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/** Matches public `/q/[token]` total line (whole dollars, no cents). */
function formatQuoteTotalFromDigits(digits: string): string {
  if (!digits) return '—';
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
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
  mode = 'create',
  quoteId,
}) => {
  const isEdit = mode === 'edit' && Boolean(quoteId?.trim());
  const editId = quoteId?.trim() ?? '';

  const {
    quote,
    loadStatus: quoteLoadStatus,
    loadError: quoteLoadError,
    reloadQuote,
  } = useDashboardQuoteDetail(editId, { enabled: isEdit });

  const hydratedIdRef = useRef<string | null>(null);
  const editHydratedRef = useRef(false);
  const prevDurationRef = useRef<string | null>(null);

  const [step, setStep] = useState<Step>('details');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [priceDigits, setPriceDigits] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('01:00');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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
    hydratedIdRef.current = null;
    editHydratedRef.current = false;
    prevDurationRef.current = null;
  }, [editId]);

  useLayoutEffect(() => {
    if (!isEdit || quoteLoadStatus !== 'ready' || !quote) return;
    if (!isDashboardQuoteEditableByOwner(quote.status)) return;
    if (hydratedIdRef.current === quote.id) return;
    hydratedIdRef.current = quote.id;

    setCustomerName(quote.customerName);
    setCustomerEmail(quote.customerEmail);
    setCustomerPhone(
      (quote.customerPhone ?? '').replace(/\D/g, '').slice(0, 10)
    );
    setVehicleYear(quote.vehicleYear ?? '');
    setVehicleMake(quote.vehicleMake ?? '');
    setVehicleModel(quote.vehicleModel ?? '');
    setServiceName(quote.serviceName);
    setPriceDigits(centsToWholeDollarDigits(quote.totalCents));
    const durPick = durationPickerValueFromQuote(quote);
    setDurationHHmm(durPick);
    setNote(quote.note ?? '');
    setSelectedDate(parseLocalDateFromYmd(quote.scheduledDate));
    setSelectedTime(pickStartTimeHHmm(quote.scheduledTime));
    setStep('details');
    setSendError(null);

    editHydratedRef.current = true;
    prevDurationRef.current = durPick;
  }, [isEdit, quote, quoteLoadStatus]);

  useEffect(() => {
    const gate = !isEdit || editHydratedRef.current;
    if (!gate) {
      prevDurationRef.current = durationHHmm;
      return;
    }
    if (prevDurationRef.current === null) {
      prevDurationRef.current = durationHHmm;
      return;
    }
    if (prevDurationRef.current !== durationHHmm) {
      setSelectedDate(null);
      setSelectedTime(null);
    }
    prevDurationRef.current = durationHHmm;
  }, [durationHHmm, isEdit]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const canProceedDetails = useMemo(() => {
    const phoneOk = customerPhone.length === 0 || customerPhone.length === 10;
    return (
      customerName.trim().length > 0 &&
      isValidEmail(customerEmail) &&
      phoneOk &&
      serviceName.trim().length > 0 &&
      priceDigits.trim().length > 0 &&
      isValidServiceEditDurationInput(durationHHmm)
    );
  }, [
    customerEmail,
    customerName,
    customerPhone.length,
    durationHHmm,
    priceDigits,
    serviceName,
  ]);

  const canProceedSchedule = selectedDate !== null && selectedTime !== null;

  const canSend = canProceedDetails && canProceedSchedule;

  const handleSelectDate = (d: Date) => {
    setSelectedDate(d);
    setSelectedTime(null);
  };

  const formatDateForApi = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const buildQuoteRequestBody = () => {
    const parsedDollars = parseInt(priceDigits, 10);
    const priceCents = Number.isFinite(parsedDollars) ? parsedDollars * 100 : 0;
    return {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.length === 10 ? customerPhone : undefined,
      vehicleYear: vehicleYear.trim() || undefined,
      vehicleMake: vehicleMake.trim() || undefined,
      vehicleModel: vehicleModel.trim() || undefined,
      serviceName: serviceName.trim(),
      priceCents,
      durationMinutes,
      note: note.trim() || undefined,
      scheduledDate: formatDateForApi(selectedDate!),
      scheduledStartTime: selectedTime!,
    };
  };

  const handleSubmitQuote = async () => {
    if (!selectedDate || !selectedTime || !canSend || sendingQuote) return;
    setSendError(null);
    setSendingQuote(true);

    try {
      if (isEdit) {
        const res = await fetch(`/api/quotes/${encodeURIComponent(editId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildQuoteRequestBody()),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !json?.success) {
          setSendError(
            json?.error || 'Could not save changes. Please try again.'
          );
          return;
        }
        setStep('sent');
        return;
      }

      const res = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: businessSlug ?? '',
          ...buildQuoteRequestBody(),
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { publicUrl?: string };
      };
      if (!res.ok || !json?.success) {
        setSendError(json?.error || 'Failed to send quote. Please try again.');
        return;
      }

      setStep('sent');
    } catch {
      setSendError(
        isEdit
          ? 'Could not save changes. Please try again.'
          : 'Failed to send quote. Please try again.'
      );
    } finally {
      setSendingQuote(false);
    }
  };

  if (isEdit && quoteLoadStatus === 'loading') {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTE_DETAIL(editId)}
            backLabel="Quote"
          />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            <div className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          </div>
        </div>
      </main>
    );
  }

  if (isEdit && quoteLoadStatus === 'error') {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTE_DETAIL(editId)}
            backLabel="Quote"
            title="Edit quote"
            subtitle={quoteLoadError ?? 'Something went wrong.'}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              href={ROUTES.DASHBOARD.QUOTE_DETAIL(editId)}
              variant="secondary"
            >
              Back to quote
            </Button>
            <Button variant="inverse" onClick={() => void reloadQuote()}>
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (isEdit && quote && !isDashboardQuoteEditableByOwner(quote.status)) {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
        <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <QuoteFlowHeader
            backHref={ROUTES.DASHBOARD.QUOTE_DETAIL(editId)}
            backLabel="Quote"
            title="Editing unavailable"
            subtitle="This quote cannot be edited after the customer has accepted or declined. Create a new quote if you need to change the offer."
          />
          <Button
            href={ROUTES.DASHBOARD.QUOTE_DETAIL(editId)}
            variant="inverse"
          >
            Back to quote
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 pb-32 pt-6 sm:px-6 sm:pb-32 sm:pt-8 lg:px-8 lg:pt-10">
        {step === 'details' ? (
          <QuoteFlowHeader
            backHref={
              isEdit
                ? ROUTES.DASHBOARD.QUOTE_DETAIL(editId)
                : ROUTES.DASHBOARD.MAIN
            }
            backLabel={isEdit ? 'Quote' : 'Dashboard'}
            title={isEdit ? 'Edit quote' : 'New Quote'}
            subtitle={
              isEdit
                ? 'Update details, schedule, and save. Your customer will see changes the next time they open the link.'
                : 'Add details, pick a time, and send your customer an approval link.'
            }
          />
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
              <PhoneInput
                label="Phone"
                value={customerPhone}
                onChange={setCustomerPhone}
                required={false}
                error={
                  customerPhone.length > 0 && customerPhone.length < 10
                    ? 'Enter a full number or leave blank'
                    : undefined
                }
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Vehicle year"
                  placeholder="e.g. 2020"
                  value={vehicleYear}
                  onChange={setVehicleYear}
                  inputMode="numeric"
                  maxLength={4}
                  required={false}
                />
                <Input
                  label="Vehicle make"
                  placeholder="e.g. Toyota"
                  value={vehicleMake}
                  onChange={setVehicleMake}
                  required={false}
                />
                <Input
                  label="Vehicle model"
                  placeholder="e.g. Camry"
                  value={vehicleModel}
                  onChange={setVehicleModel}
                  required={false}
                />
              </div>

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
                label="Note"
                placeholder='e.g. "Clay bar included"'
                value={note}
                onChange={setNote}
                rows={3}
                maxLength={500}
                required={false}
              />
            </div>
          </GlassCard>
        )}

        {step === 'schedule' && (
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
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {isEdit ? 'Review changes' : 'Review quote'}
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
                    {formatDurationMinutes(durationMinutes)}
                  </p>
                </div>
                <div className="h-px bg-white/10" />

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
                <div className="h-px bg-white/10" />

                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Customer
                  </p>
                  <p className="font-medium text-white">
                    {customerName.trim()}
                  </p>
                  <p className="break-words text-sm text-gray-400">
                    {customerEmail.trim()}
                  </p>
                  {customerPhone.length === 10 ? (
                    <p className="mt-0.5 text-sm text-gray-400 tabular-nums">
                      {formatUsPhoneDigits(customerPhone)}
                    </p>
                  ) : null}
                </div>
                {vehicleYear.trim() ||
                vehicleMake.trim() ||
                vehicleModel.trim() ? (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-1 text-xs tracking-wider text-gray-500">
                        Vehicle
                      </p>
                      <p className="font-medium text-white">
                        {[
                          vehicleYear.trim(),
                          vehicleMake.trim(),
                          vehicleModel.trim(),
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    </div>
                  </>
                ) : null}

                {note.trim().length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-1 text-xs tracking-wider text-gray-500">
                        Note
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-gray-400">
                        {note.trim()}
                      </p>
                    </div>
                  </>
                )}
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                  <p className="text-sm font-medium text-gray-300">Total</p>
                  <p className="text-lg font-bold text-white">
                    {formatQuoteTotalFromDigits(priceDigits)}
                  </p>
                </div>
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
              {isEdit ? 'Quote updated' : 'Quote sent'}
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-center text-sm text-gray-400">
              {isEdit
                ? 'Your changes are saved. The customer will see the updated details the next time they open their link.'
                : 'The quote has been emailed to your customer. They can review the details and accept or decline from that email.'}
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
                  {isEdit ? 'Updated summary' : 'Quote summary'}
                </p>
              </div>
              <div className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">Service</p>
                  <p className="font-semibold text-white">
                    {serviceName.trim()}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatDurationMinutes(durationMinutes)}
                  </p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-white">
                    {customerName.trim()}
                  </p>
                  <p className="break-words text-sm text-gray-400">
                    {customerEmail.trim()}
                  </p>
                  {customerPhone.length === 10 ? (
                    <p className="mt-0.5 text-sm text-gray-400 tabular-nums">
                      {formatUsPhoneDigits(customerPhone)}
                    </p>
                  ) : null}
                </div>
                {vehicleYear.trim() ||
                vehicleMake.trim() ||
                vehicleModel.trim() ? (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-0.5 text-xs text-gray-500">Vehicle</p>
                      <p className="font-medium text-white">
                        {[
                          vehicleYear.trim(),
                          vehicleMake.trim(),
                          vehicleModel.trim(),
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    </div>
                  </>
                ) : null}
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-0.5 text-xs text-gray-500">
                    Date &amp; time
                  </p>
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
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                  <p className="text-sm font-medium text-gray-300">Total</p>
                  <p className="text-lg font-bold text-white">
                    {formatQuoteTotalFromDigits(priceDigits)}
                  </p>
                </div>
              </div>
            </GlassCard>
            <Link
              href={
                isEdit
                  ? ROUTES.DASHBOARD.QUOTE_DETAIL(editId)
                  : ROUTES.DASHBOARD.MAIN
              }
              className="inline-flex min-h-[48px] items-center justify-center self-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
            >
              {isEdit ? 'Back to quote' : 'Back to dashboard'}
            </Link>
          </div>
        )}
      </div>

      {/* Match public booking flow: sticky bottom bar + inverse primary (see AvailabilityBookingPage) */}
      {step !== 'sent' ? (
        <QuoteStickyBar
          containerClassName="max-w-3xl min-w-0 px-0 sm:px-0"
          withDesktopSidebarOffset
        >
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
                disabled={!canSend || sendingQuote}
                onClick={handleSubmitQuote}
              >
                {sendingQuote
                  ? isEdit
                    ? 'Saving...'
                    : 'Sending...'
                  : isEdit
                    ? 'Save changes'
                    : 'Send quote'}
              </Button>
            </div>
          )}
          {step === 'review' && sendError ? (
            <p className="mt-2 text-sm text-red-400">{sendError}</p>
          ) : null}
        </QuoteStickyBar>
      ) : null}
    </main>
  );
};

export default CreateQuoteScreen;
