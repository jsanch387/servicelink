'use client';

import {
  Button,
  GlassCard,
  Input,
  PhoneInput,
  WarningCallout,
  formatUsPhoneDigits,
} from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import { useDashboardQuoteDetail } from '@/features/quotes/dashboard/hooks/useDashboardQuoteDetail';
import { isDashboardQuoteEditableByOwner } from '@/features/quotes/dashboard/utils/isDashboardQuoteEditableByOwner';
import { parsePublicQuoteRequestNote } from '@/features/quotes/dashboard/utils/parsePublicQuoteRequestNote';
import {
  centsToWholeDollarDigits,
  durationPickerValueFromQuote,
  parseLocalDateFromYmd,
  pickStartTimeHHmm,
} from '@/features/quotes/dashboard/utils/quoteFormHydrationFromDashboard';
import { useOwnerQuoteScheduling } from '@/features/quotes/hooks/useOwnerQuoteScheduling';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import { QuoteStickyBar } from '@/features/quotes/shared/components/QuoteStickyBar';
import { QuoteServiceSummaryCard } from '@/features/quotes/shared/components/QuoteServiceSummaryCard';
import { resolveCustomerRequestRawText } from '@/features/quotes/shared/resolveCustomerRequestRawText';
import type { QuoteAddonDetail } from '@/features/quotes/shared/quoteServiceSnapshot';
import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import {
  QuoteServiceStep,
  isQuoteCatalogPhaseReady,
  isQuoteCatalogSelectionComplete,
  type QuoteCatalogPhase,
  type QuoteCatalogSelection,
  type QuoteServiceMode,
} from '@/features/quotes/components/QuoteServiceStep';
import {
  isValidServiceEditDurationInput,
  parseServiceEditDurationForSave,
} from '@/features/services/utils/serviceEditForm';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React, {
  useCallback,
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
  /** Active catalog services for “from your services” on the service step. */
  serviceCatalog?: QuoteCatalogService[];
  serviceCategories?: ServiceCategoryRow[];
};

type Step = 'customer' | 'vehicle' | 'service' | 'schedule' | 'review' | 'sent';

/** How the owner wants to handle scheduling on the date step. */
type ScheduleMode = 'pick' | 'customer' | null;

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
  serviceCatalog = [],
  serviceCategories = [],
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
  const [preferredTimingHint, setPreferredTimingHint] = useState<string | null>(
    null
  );
  const [customerRequestDetails, setCustomerRequestDetails] = useState('');

  const [step, setStep] = useState<Step>('customer');
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
  const [serviceMode, setServiceMode] = useState<QuoteServiceMode>(null);
  const [catalogPhase, setCatalogPhase] = useState<QuoteCatalogPhase>('list');
  const [catalogSelection, setCatalogSelection] =
    useState<QuoteCatalogSelection>({
      serviceId: null,
      priceOptionId: null,
      addOnIds: [],
    });
  const [catalogAddonDetails, setCatalogAddonDetails] = useState<
    QuoteAddonDetail[]
  >([]);
  const [catalogServicePriceCents, setCatalogServicePriceCents] = useState<
    number | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(null);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const durationMinutes = useMemo(() => {
    const r = parseServiceEditDurationForSave(durationHHmm);
    return r.ok ? r.durationMinutes : 60;
  }, [durationHHmm]);

  const isFirstSendFromEdit = useMemo(
    () =>
      Boolean(
        isEdit &&
          quote &&
          (quote.status === 'requested' || quote.status === 'draft')
      ),
    [isEdit, quote]
  );

  const isFinishingCustomerRequest = useMemo(
    () =>
      Boolean(isFirstSendFromEdit && quote?.source === 'customer_requested'),
    [isFirstSendFromEdit, quote?.source]
  );

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
    setPreferredTimingHint(null);
    setCustomerRequestDetails('');
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
    setServiceMode('custom');
    setCatalogPhase('list');
    setCatalogSelection({
      serviceId: null,
      priceOptionId: null,
      addOnIds: [],
    });
    setCatalogAddonDetails([]);
    setCatalogServicePriceCents(null);
    setPreferredTimingHint(null);
    setCustomerRequestDetails('');
    if (quote.source === 'customer_requested') {
      const raw = resolveCustomerRequestRawText(quote);
      const parsed = parsePublicQuoteRequestNote(raw);
      setCustomerRequestDetails(parsed.detailsOnly);
      setPreferredTimingHint(parsed.preferredTiming);
      const legacyIntake =
        !quote.requestMessage?.trim() &&
        (quote.status === 'requested' || quote.status === 'draft');
      setNote(legacyIntake ? '' : (quote.note?.trim() ?? ''));
    } else {
      setNote(quote.note ?? '');
    }
    setSelectedDate(parseLocalDateFromYmd(quote.scheduledDate));
    setSelectedTime(pickStartTimeHHmm(quote.scheduledTime));
    setScheduleMode(
      quote.scheduledDate?.trim() && quote.scheduledTime?.trim() ? 'pick' : null
    );
    setStep('customer');
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
      setScheduleMode(null);
    }
    prevDurationRef.current = durationHHmm;
  }, [durationHHmm, isEdit]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step, scheduleMode, catalogPhase, serviceMode]);

  const canProceedCustomer = useMemo(() => {
    const phoneOk = customerPhone.length === 0 || customerPhone.length === 10;
    return (
      customerName.trim().length > 0 && isValidEmail(customerEmail) && phoneOk
    );
  }, [customerEmail, customerName, customerPhone.length]);

  const canProceedService = useMemo(() => {
    const fieldsOk =
      serviceName.trim().length > 0 &&
      priceDigits.trim().length > 0 &&
      isValidServiceEditDurationInput(durationHHmm);
    if (serviceMode === 'custom') return fieldsOk;
    if (serviceMode === 'catalog') {
      return isQuoteCatalogPhaseReady(
        catalogPhase,
        serviceCatalog,
        catalogSelection
      );
    }
    return false;
  }, [
    catalogPhase,
    catalogSelection,
    durationHHmm,
    priceDigits,
    serviceCatalog,
    serviceMode,
    serviceName,
  ]);

  const handleCatalogDerivedChange = useCallback(
    (derived: {
      serviceName: string;
      priceDigits: string;
      durationHHmm: string;
      servicePriceCents: number;
      addonDetails: QuoteAddonDetail[];
    }) => {
      setServiceName(derived.serviceName);
      setPriceDigits(derived.priceDigits);
      setDurationHHmm(derived.durationHHmm);
      setCatalogServicePriceCents(derived.servicePriceCents);
      setCatalogAddonDetails(derived.addonDetails);
    },
    []
  );

  const reviewAddOns = useMemo(() => {
    if (serviceMode !== 'catalog') return null;
    return catalogAddonDetails.length > 0 ? catalogAddonDetails : null;
  }, [catalogAddonDetails, serviceMode]);

  const reviewOptionLabel = useMemo(() => {
    if (serviceMode !== 'catalog' || !catalogSelection.serviceId) return null;
    const svc = serviceCatalog.find(s => s.id === catalogSelection.serviceId);
    if (!svc || !catalogSelection.priceOptionId) return null;
    return (
      svc.priceOptions.find(o => o.id === catalogSelection.priceOptionId)
        ?.label ?? null
    );
  }, [catalogSelection, serviceCatalog, serviceMode]);

  const scheduleComplete = selectedDate !== null && selectedTime !== null;
  const scheduleEmpty = selectedDate === null && selectedTime === null;
  /** Allow review with no schedule, or with a full date+time (not a half pick). */
  const canProceedSchedule =
    scheduleMode === 'customer'
      ? scheduleEmpty
      : scheduleMode === 'pick'
        ? scheduleComplete
        : scheduleEmpty || scheduleComplete;

  const canSend = canProceedCustomer && canProceedService && canProceedSchedule;

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
    const noteTrimmed = note.trim();
    const body: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      vehicleYear?: string;
      vehicleMake?: string;
      vehicleModel?: string;
      serviceName: string;
      priceCents: number;
      durationMinutes: number;
      note?: string;
      scheduledDate?: string;
      scheduledStartTime?: string;
      serviceId?: string;
      servicePriceOptionId?: string;
      servicePriceCents?: number;
      addonDetails?: QuoteAddonDetail[];
    } = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.length === 10 ? customerPhone : undefined,
      vehicleYear: vehicleYear.trim() || undefined,
      vehicleMake: vehicleMake.trim() || undefined,
      vehicleModel: vehicleModel.trim() || undefined,
      serviceName: serviceName.trim(),
      priceCents,
      durationMinutes,
      note: noteTrimmed || undefined,
    };
    if (selectedDate && selectedTime) {
      body.scheduledDate = formatDateForApi(selectedDate);
      body.scheduledStartTime = selectedTime;
    }
    if (serviceMode === 'catalog' && catalogSelection.serviceId) {
      body.serviceId = catalogSelection.serviceId;
      if (catalogSelection.priceOptionId) {
        body.servicePriceOptionId = catalogSelection.priceOptionId;
      }
      if (catalogServicePriceCents != null) {
        body.servicePriceCents = catalogServicePriceCents;
      }
      if (catalogAddonDetails.length > 0) {
        body.addonDetails = catalogAddonDetails;
      }
    }
    return body;
  };

  const handleSubmitQuote = async () => {
    if (!canSend || sendingQuote) return;
    if ((selectedDate && !selectedTime) || (!selectedDate && selectedTime)) {
      return;
    }
    setSendError(null);
    setSendingQuote(true);

    try {
      if (isEdit) {
        if (isFirstSendFromEdit) {
          const slug = businessSlug?.trim() ?? '';
          if (!slug) {
            setSendError(
              'Add a public profile slug before sending this quote from your business settings.'
            );
            return;
          }
          const res = await fetch(API_ROUTES.QUOTE_SEND_EXISTING(editId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessSlug: slug,
              ...buildQuoteRequestBody(),
            }),
          });
          const json = (await res.json()) as {
            success?: boolean;
            error?: string;
          };
          if (!res.ok || !json?.success) {
            setSendError(
              json?.error || 'Failed to send quote. Please try again.'
            );
            return;
          }
          setStep('sent');
          return;
        }

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
        isEdit && !isFirstSendFromEdit
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
        {step === 'customer' ? (
          <QuoteFlowHeader
            backHref={
              isEdit
                ? ROUTES.DASHBOARD.QUOTE_DETAIL(editId)
                : ROUTES.DASHBOARD.MAIN
            }
            backLabel={isEdit ? 'Quote' : 'Dashboard'}
            title={
              isFinishingCustomerRequest
                ? 'Create quote'
                : isEdit
                  ? 'Edit quote'
                  : 'New Quote'
            }
            subtitle={
              isEdit && !isFinishingCustomerRequest
                ? 'Update customer, vehicle, service, and schedule, then save. Your customer will see changes the next time they open the link.'
                : 'Customer, vehicle, service, then date — or let them choose when they accept.'
            }
          />
        ) : null}

        {step === 'vehicle' ? (
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Vehicle
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Optional — add year, make, and model if you have them.
            </p>
          </div>
        ) : null}

        {step === 'service' ? (
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Service
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {serviceMode === 'catalog'
                ? catalogPhase === 'list'
                  ? 'Choose a service from your list.'
                  : catalogPhase === 'option'
                    ? 'Choose an option.'
                    : catalogPhase === 'addons'
                      ? 'Add anything extra, or continue.'
                      : "Here's what you selected."
                : serviceMode === 'custom'
                  ? 'Enter the name, price, and duration.'
                  : 'Choose a service from your list, or add a custom one.'}
            </p>
          </div>
        ) : null}

        {step === 'schedule' ? (
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Date &amp; time
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {scheduleMode === 'pick'
                ? 'Pick an available slot for this quote.'
                : 'Choose a date yourself, or let your customer pick when they accept.'}
            </p>
          </div>
        ) : null}

        {step === 'customer' && (
          <div className="w-full space-y-6">
            {customerRequestDetails.trim() ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-200">
                  Customer notes
                </h3>
                <GlassCard
                  padding="md"
                  rounded="rounded-2xl"
                  blurColor="bg-zinc-500"
                  showBlur={true}
                  className="w-full"
                >
                  <p className="whitespace-pre-wrap text-sm text-gray-300">
                    {customerRequestDetails.trim()}
                  </p>
                </GlassCard>
              </div>
            ) : null}
            <GlassCard
              padding="md"
              rounded="rounded-2xl"
              blurColor="bg-zinc-500"
              showBlur={true}
              className="w-full"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-200">
                    Customer
                  </p>
                  <div className="mt-2 h-px w-full bg-white/10" aria-hidden />
                </div>
                <div className="space-y-5">
                  <Input
                    label="Name"
                    placeholder="e.g. Jordan Lee"
                    value={customerName}
                    onChange={setCustomerName}
                    required
                    autoComplete="name"
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      showDigitHint={false}
                      error={
                        customerPhone.length > 0 && customerPhone.length < 10
                          ? 'Enter a full number or leave blank'
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {step === 'vehicle' && (
          <div className="w-full space-y-6">
            <GlassCard
              padding="md"
              rounded="rounded-2xl"
              blurColor="bg-zinc-500"
              showBlur={true}
              className="w-full"
            >
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
            </GlassCard>
          </div>
        )}

        {step === 'service' && (
          <QuoteServiceStep
            catalog={serviceCatalog}
            serviceCategories={serviceCategories}
            mode={serviceMode}
            onModeChange={next => {
              if (next === 'catalog') {
                setCatalogSelection({
                  serviceId: null,
                  priceOptionId: null,
                  addOnIds: [],
                });
                setCatalogPhase('list');
              }
              if (next === 'custom' && serviceMode === 'catalog') {
                setServiceName('');
                setPriceDigits('');
                setDurationHHmm('01:00');
                setCatalogAddonDetails([]);
                setCatalogServicePriceCents(null);
              }
              setServiceMode(next);
            }}
            catalogPhase={catalogPhase}
            onCatalogPhaseChange={setCatalogPhase}
            selection={catalogSelection}
            onSelectionChange={setCatalogSelection}
            serviceName={serviceName}
            onServiceNameChange={setServiceName}
            priceDigits={priceDigits}
            onPriceDigitsChange={setPriceDigits}
            durationHHmm={durationHHmm}
            onDurationHHmmChange={setDurationHHmm}
            note={note}
            onNoteChange={setNote}
            onCatalogDerivedChange={handleCatalogDerivedChange}
          />
        )}

        {step === 'schedule' && (
          <div className="space-y-6 pt-1">
            {preferredTimingHint?.trim() ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-300">
                <span className="font-medium text-gray-200">
                  Preferred time
                </span>
                <span className="mx-1.5 text-gray-500">—</span>
                <span className="whitespace-pre-wrap text-gray-300">
                  {preferredTimingHint.trim()}
                </span>
              </div>
            ) : null}

            {scheduleMode !== 'pick' ? (
              <div
                className="space-y-2"
                role="radiogroup"
                aria-label="Date and time options"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={false}
                  onClick={() => setScheduleMode('pick')}
                  className="flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      Choose a date
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                      Pick date and time now on your calendar.
                    </span>
                  </span>
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={false}
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setScheduleMode('customer');
                    setStep('review');
                  }}
                  className="flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      Let customer choose
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                      They&apos;ll pick a date when they accept the quote.
                    </span>
                  </span>
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20"
                    aria-hidden
                  />
                </button>
              </div>
            ) : (
              <>
                {!hasSavedAvailability && (
                  <WarningCallout>
                    We don&apos;t see a saved weekly schedule yet. Showing
                    default hours for slot suggestions —{' '}
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
                    Add a public profile link to load your existing bookings
                    into this picker and avoid double-booking.
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
              </>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {isEdit && !isFirstSendFromEdit
                  ? 'Review changes'
                  : 'Review quote'}
              </h2>
              <button
                type="button"
                onClick={() => setStep('customer')}
                className="cursor-pointer text-sm font-medium text-zinc-400 underline underline-offset-4 transition-colors hover:text-white"
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
                  <p className="mb-1 text-sm font-medium text-gray-500">
                    Service
                  </p>
                  <QuoteServiceSummaryCard
                    serviceName={serviceName.trim()}
                    optionLabel={reviewOptionLabel}
                    durationMinutes={durationMinutes}
                    totalCents={
                      Number.isFinite(parseInt(priceDigits, 10))
                        ? parseInt(priceDigits, 10) * 100
                        : 0
                    }
                    addOns={reviewAddOns}
                  />
                </div>
                <div className="h-px bg-white/10" />

                <div>
                  <p className="mb-1 text-sm font-medium text-gray-500">
                    Date &amp; time
                  </p>
                  {scheduleComplete && selectedDate && selectedTime ? (
                    <>
                      <p className="font-medium text-white">
                        {formatReviewDate(selectedDate)}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-400">
                        Starts {formatTime12(selectedTime)}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-white">
                      Customer will choose when accepting
                    </p>
                  )}
                </div>
                <div className="h-px bg-white/10" />

                <div>
                  <p className="mb-1 text-sm font-medium text-gray-500">
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
                      <p className="mb-1 text-sm font-medium text-gray-500">
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

                {customerRequestDetails.trim() ? (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-500">
                        Customer note
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-gray-400">
                        {customerRequestDetails.trim()}
                      </p>
                    </div>
                  </>
                ) : null}

                {note.trim().length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-500">
                        Your notes
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

        {step === 'sent' && (
          <div className="flex w-full flex-col py-6 pb-14">
            <div className="mb-7 flex h-20 w-20 self-center items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <CheckIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-2 text-center text-2xl font-bold text-white">
              {isEdit && !isFirstSendFromEdit ? 'Quote updated' : 'Quote sent'}
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-center text-sm text-gray-400">
              {isEdit && !isFirstSendFromEdit
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
                <p className="text-xs font-semibold text-gray-400">
                  {isEdit && !isFirstSendFromEdit
                    ? 'Updated summary'
                    : 'Quote summary'}
                </p>
              </div>
              <div className="space-y-4 p-4 sm:p-6">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-gray-500">
                    Service
                  </p>
                  <QuoteServiceSummaryCard
                    serviceName={serviceName.trim()}
                    optionLabel={reviewOptionLabel}
                    durationMinutes={durationMinutes}
                    totalCents={
                      Number.isFinite(parseInt(priceDigits, 10))
                        ? parseInt(priceDigits, 10) * 100
                        : 0
                    }
                    addOns={reviewAddOns}
                  />
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-0.5 text-sm font-medium text-gray-500">
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
                      <p className="mb-0.5 text-sm font-medium text-gray-500">
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
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-0.5 text-sm font-medium text-gray-500">
                    Date &amp; time
                  </p>
                  {scheduleComplete && selectedDate && selectedTime ? (
                    <>
                      <p className="font-medium text-white">
                        {formatReviewDate(selectedDate)}
                      </p>
                      <p className="text-sm text-gray-400">
                        Starts {formatTime12(selectedTime)}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-white">
                      Customer will choose when accepting
                    </p>
                  )}
                </div>
                {customerRequestDetails.trim() ? (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-0.5 text-sm font-medium text-gray-500">
                        Customer note
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-gray-400">
                        {customerRequestDetails.trim()}
                      </p>
                    </div>
                  </>
                ) : null}
                {note.trim().length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="mb-0.5 text-sm font-medium text-gray-500">
                        Your notes
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
            <Link
              href={
                isEdit
                  ? ROUTES.DASHBOARD.QUOTE_DETAIL(editId)
                  : ROUTES.DASHBOARD.MAIN
              }
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center self-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
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
          {step === 'customer' && (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              className="font-semibold"
              disabled={!canProceedCustomer}
              onClick={() => setStep('vehicle')}
            >
              Continue
            </Button>
          )}
          {step === 'vehicle' && (
            <div className="flex items-stretch gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 self-auto px-5"
                onClick={() => setStep('customer')}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="inverse"
                size="sm"
                className="min-w-0 flex-1 font-semibold"
                onClick={() => setStep('service')}
              >
                Continue
              </Button>
            </div>
          )}
          {step === 'service' && (
            <div className="flex items-stretch gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 self-auto px-5"
                onClick={() => {
                  if (serviceMode === 'catalog') {
                    if (catalogPhase === 'ready') {
                      const svc = serviceCatalog.find(
                        s => s.id === catalogSelection.serviceId
                      );
                      if (svc && svc.addOns.length > 0) {
                        setCatalogPhase('addons');
                        return;
                      }
                      if (
                        svc?.priceOptionsEnabled &&
                        svc.priceOptions.length > 0
                      ) {
                        setCatalogPhase('option');
                        return;
                      }
                      setCatalogSelection({
                        serviceId: null,
                        priceOptionId: null,
                        addOnIds: [],
                      });
                      setCatalogPhase('list');
                      return;
                    }
                    if (catalogPhase === 'addons') {
                      const svc = serviceCatalog.find(
                        s => s.id === catalogSelection.serviceId
                      );
                      if (
                        svc?.priceOptionsEnabled &&
                        svc.priceOptions.length > 0
                      ) {
                        setCatalogPhase('option');
                        return;
                      }
                      setCatalogSelection({
                        serviceId: null,
                        priceOptionId: null,
                        addOnIds: [],
                      });
                      setCatalogPhase('list');
                      return;
                    }
                    if (catalogPhase === 'option') {
                      setCatalogSelection({
                        serviceId: null,
                        priceOptionId: null,
                        addOnIds: [],
                      });
                      setCatalogPhase('list');
                      return;
                    }
                    setCatalogPhase('list');
                    setServiceMode(null);
                    return;
                  }
                  if (serviceMode !== null) {
                    setCatalogSelection({
                      serviceId: null,
                      priceOptionId: null,
                      addOnIds: [],
                    });
                    setCatalogPhase('list');
                    setServiceMode(null);
                    return;
                  }
                  setStep('vehicle');
                }}
              >
                Back
              </Button>
              {serviceMode !== null ? (
                <Button
                  type="button"
                  variant="inverse"
                  size="sm"
                  className="min-w-0 flex-1 font-semibold"
                  disabled={!canProceedService}
                  onClick={() => {
                    if (
                      serviceMode === 'catalog' &&
                      catalogPhase === 'addons' &&
                      isQuoteCatalogSelectionComplete(
                        serviceCatalog,
                        catalogSelection
                      )
                    ) {
                      setCatalogPhase('ready');
                      return;
                    }
                    if (scheduleComplete) {
                      setScheduleMode('pick');
                    } else {
                      setScheduleMode(null);
                    }
                    setStep('schedule');
                  }}
                >
                  Continue
                </Button>
              ) : null}
            </div>
          )}
          {step === 'schedule' && (
            <div className="flex items-stretch gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 self-auto px-5"
                onClick={() => {
                  if (scheduleMode === 'pick') {
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setScheduleMode(null);
                    return;
                  }
                  setStep('service');
                }}
              >
                Back
              </Button>
              {scheduleMode === 'pick' ? (
                <Button
                  type="button"
                  variant="inverse"
                  size="sm"
                  className="min-w-0 flex-1 font-semibold"
                  disabled={!scheduleComplete}
                  onClick={() => setStep('review')}
                >
                  Review quote
                </Button>
              ) : null}
            </div>
          )}
          {step === 'review' && (
            <div className="flex items-stretch gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 self-auto px-5"
                onClick={() => {
                  if (scheduleComplete) {
                    setScheduleMode('pick');
                  } else {
                    setScheduleMode(null);
                  }
                  setStep('schedule');
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="inverse"
                size="sm"
                className="min-w-0 flex-1 font-semibold"
                loading={sendingQuote}
                disabled={!canSend || sendingQuote}
                onClick={handleSubmitQuote}
              >
                {sendingQuote
                  ? isEdit && !isFirstSendFromEdit
                    ? 'Saving'
                    : 'Sending'
                  : isEdit && !isFirstSendFromEdit
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
