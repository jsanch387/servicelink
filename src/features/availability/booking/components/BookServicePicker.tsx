'use client';

import {
  Button,
  Input,
  PriceInput,
  TextArea,
  TimeSelect,
} from '@/components/shared';
import {
  getBusinessBookDetailsPath,
  getBusinessBookCustomScheduleUrl,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { BookFlowServiceRow } from '@/features/availability/booking/components/BookFlowServiceRow';
import { BOOKING_CUSTOMER_NOTES_MAX } from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { PublicServiceCategoryFilters } from '@/features/business-profile/components/PublicServiceCategoryFilters';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '@/features/services/categories/types/serviceCategories';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import {
  SERVICE_EDIT_DURATION_ERROR,
  parseServiceEditDurationForSave,
} from '@/features/services/utils/serviceEditForm';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface BookServicePickerItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  priceOptionsEnabled: boolean;
  hours_to_complete: number | null;
  duration_minutes: number | null;
  category_id: string | null;
}

export interface BookServicePickerProps {
  businessSlug: string;
  businessName: string;
  services: BookServicePickerItem[];
  serviceCategories?: ServiceCategoryRow[];
  /** True when opened from the dashboard (owner booking on a customer's behalf). */
  isOwnerManualBooking?: boolean;
  /** Owner-only: restore services list after returning from service details. */
  initialEntryMode?: 'choice' | 'services' | 'custom';
  bookingFlowLocale?: PublicBookingFlowLocale;
}

function filterPickerServicesByCategory(
  services: BookServicePickerItem[],
  activeFilterId: string
): BookServicePickerItem[] {
  if (activeFilterId === SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID) {
    return services.filter(service => service.category_id == null);
  }
  return services.filter(service => service.category_id === activeFilterId);
}

function OwnerBookingPickerFooter({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm safe-area-pb">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );
}

/**
 * First step when visiting /[slug]/book without a service: choose a service,
 * then continue to /book/details (add-ons if any) and the calendar.
 */
export function BookServicePicker({
  businessSlug,
  businessName,
  services,
  serviceCategories = [],
  isOwnerManualBooking = false,
  initialEntryMode,
  bookingFlowLocale = 'en',
}: BookServicePickerProps) {
  const router = useRouter();
  const ui = publicBookingUi(bookingFlowLocale);
  const [entryMode, setEntryMode] = useState<'choice' | 'services' | 'custom'>(
    isOwnerManualBooking ? (initialEntryMode ?? 'choice') : 'services'
  );
  const [customServiceName, setCustomServiceName] = useState('');
  const [customPriceDigits, setCustomPriceDigits] = useState('');
  const [customDurationHHmm, setCustomDurationHHmm] = useState('01:00');
  const [customNotes, setCustomNotes] = useState('');

  const showCategoryFilters = shouldShowPublicServiceCategoryFilters(
    serviceCategories,
    services
  );

  const categoryOptions = useMemo(
    () =>
      showCategoryFilters
        ? buildPublicServiceCategoryOptions(
            serviceCategories,
            services,
            ui.profile.serviceCategoryOther
          )
        : [],
    [
      showCategoryFilters,
      serviceCategories,
      services,
      ui.profile.serviceCategoryOther,
    ]
  );

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (categoryOptions.length === 0) {
      setActiveCategoryFilter('');
      return;
    }
    setActiveCategoryFilter(prev =>
      categoryOptions.some(option => option.id === prev)
        ? prev
        : categoryOptions[0].id
    );
  }, [categoryOptions]);

  const displayServices = useMemo(() => {
    if (!showCategoryFilters || !activeCategoryFilter) return services;
    return filterPickerServicesByCategory(services, activeCategoryFilter);
  }, [services, showCategoryFilters, activeCategoryFilter]);

  const containerClassName =
    'flex flex-col min-h-[60vh] max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-24 w-full';
  const customName = customServiceName.trim();
  const customDuration = parseServiceEditDurationForSave(customDurationHHmm);
  const customDurationMinutes = customDuration.ok
    ? customDuration.durationMinutes
    : 0;
  const customPriceCents = customPriceDigits.trim()
    ? Number.parseInt(customPriceDigits, 10) * 100
    : NaN;
  const canContinueCustom =
    customName.length > 0 &&
    customDuration.ok &&
    customPriceDigits.trim().length > 0 &&
    Number.isInteger(customPriceCents) &&
    customPriceCents >= 0;

  if (isOwnerManualBooking && entryMode === 'choice') {
    return (
      <div className={containerClassName}>
        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {ui.bookPicker.createAppointmentTitle}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            {ui.bookPicker.chooseAppointmentTypeSubtitle}
          </p>
        </header>

        <div
          className="space-y-2"
          role="radiogroup"
          aria-label={ui.bookPicker.appointmentTypeAriaLabel}
        >
          {services.length > 0 ? (
            <button
              type="button"
              role="radio"
              aria-checked={false}
              onClick={() => setEntryMode('services')}
              className="flex min-h-[52px] w-full cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">
                  {ui.bookPicker.fromServicesTitle}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                  {ui.bookPicker.fromServicesDescription}
                </span>
              </span>
              <span
                className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20"
                aria-hidden
              />
            </button>
          ) : null}

          <button
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => setEntryMode('custom')}
            className="flex min-h-[52px] w-full cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">
                {ui.bookPicker.customJobTitle}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                {ui.bookPicker.customJobRowDescription}
              </span>
            </span>
            <span
              className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20"
              aria-hidden
            />
          </button>
        </div>
      </div>
    );
  }

  if (isOwnerManualBooking && entryMode === 'custom') {
    return (
      <div className={`${containerClassName} !pb-28 sm:!pb-32`}>
        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {ui.bookPicker.customJobTitle}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            {ui.bookPicker.customJobSubtitle}
          </p>
        </header>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <Input
            label={ui.bookPicker.customJobNameLabel}
            placeholder={ui.bookPicker.customJobNamePlaceholder}
            value={customServiceName}
            onChange={setCustomServiceName}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PriceInput
              label={ui.bookPicker.customJobPriceLabel}
              placeholder={ui.bookPicker.customJobPricePlaceholder}
              value={customPriceDigits}
              onChange={setCustomPriceDigits}
              required
            />
            <div className="min-w-0">
              <span className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                {ui.bookPicker.customJobDurationLabel}
                <span className="ml-1 text-red-400">*</span>
              </span>
              <TimeSelect
                variant="duration"
                value={customDurationHHmm}
                onChange={setCustomDurationHHmm}
                durationPlaceholder={ui.bookPicker.customJobDurationPlaceholder}
              />
              {customDurationHHmm.trim().length > 0 && !customDuration.ok ? (
                <p className="mt-1.5 text-sm text-red-400">
                  {SERVICE_EDIT_DURATION_ERROR}
                </p>
              ) : null}
            </div>
          </div>
          <TextArea
            label={ui.bookPicker.customJobNotesLabel}
            placeholder={ui.bookPicker.customJobNotesPlaceholder}
            value={customNotes}
            onChange={value =>
              setCustomNotes(value.slice(0, BOOKING_CUSTOMER_NOTES_MAX))
            }
            rows={3}
            maxLength={BOOKING_CUSTOMER_NOTES_MAX}
            hideCharCount
          />
        </div>

        <OwnerBookingPickerFooter>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="font-semibold"
              onClick={() => setEntryMode('choice')}
            >
              {ui.common.back}
            </Button>
            <Button
              type="button"
              variant="inverse"
              fullWidth
              className="font-semibold"
              disabled={!canContinueCustom}
              onClick={() => {
                if (!canContinueCustom) return;
                router.push(
                  getBusinessBookCustomScheduleUrl(businessSlug, {
                    serviceName: customName,
                    priceCents: customPriceCents,
                    durationMinutes: customDurationMinutes,
                    notes: customNotes.trim() || undefined,
                    forOwner: true,
                    lang: bookingFlowLocale,
                  })
                );
              }}
            >
              {ui.common.continue}
            </Button>
          </div>
        </OwnerBookingPickerFooter>
      </div>
    );
  }

  if (services.length === 0 && !isOwnerManualBooking) {
    return (
      <div className={containerClassName}>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-gray-300 text-base font-medium">
            {isOwnerManualBooking
              ? ui.bookPicker.noServicesOwnerTitle
              : ui.bookPicker.noServicesPublicTitle}
          </p>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            {isOwnerManualBooking
              ? ui.bookPicker.noServicesOwnerBody
              : ui.bookPicker.noServicesPublicBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${containerClassName} ${
        isOwnerManualBooking ? '!pb-28 sm:!pb-32' : ''
      }`}
    >
      <header className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {isOwnerManualBooking
            ? ui.bookPicker.createAppointmentTitle
            : ui.bookPicker.bookWithTitle(businessName)}
        </h1>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          {isOwnerManualBooking
            ? ui.bookPicker.createAppointmentSubtitle
            : ui.bookPicker.bookWithSubtitle}
        </p>
      </header>

      <div className="space-y-4">
        {showCategoryFilters ? (
          <PublicServiceCategoryFilters
            options={categoryOptions}
            value={activeCategoryFilter}
            onChange={setActiveCategoryFilter}
            ariaLabel={ui.profile.serviceCategoriesAriaLabel}
            edgeGutter="bookFlow"
          />
        ) : null}

        {displayServices.length > 0 ? (
          <div className="space-y-2" role="list">
            {displayServices.map(s => (
              <div key={s.id} role="listitem">
                <BookFlowServiceRow
                  service={{
                    id: s.id,
                    name: s.name,
                    priceCents: s.priceCents,
                    priceOptionsEnabled: s.priceOptionsEnabled,
                    hours_to_complete: s.hours_to_complete,
                    duration_minutes: s.duration_minutes,
                  }}
                  businessSlug={businessSlug}
                  manualBookingForCustomer={isOwnerManualBooking}
                  bookingFlowLocale={bookingFlowLocale}
                  isSelected={selectedServiceId === s.id}
                  onSelect={() => setSelectedServiceId(s.id)}
                  navigateOnSelect={!isOwnerManualBooking}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 text-center py-8">
            {ui.profile.noServicesInCategory}
          </p>
        )}
      </div>
      {isOwnerManualBooking ? (
        <OwnerBookingPickerFooter>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="font-semibold"
              onClick={() => setEntryMode('choice')}
            >
              {ui.common.back}
            </Button>
            <Button
              type="button"
              variant="inverse"
              fullWidth
              className="font-semibold"
              disabled={!selectedServiceId}
              onClick={() => {
                if (!selectedServiceId) return;
                router.push(
                  getBusinessBookDetailsPath(businessSlug, selectedServiceId, {
                    forOwner: true,
                    lang: bookingFlowLocale,
                  })
                );
              }}
            >
              {ui.common.continue}
            </Button>
          </div>
        </OwnerBookingPickerFooter>
      ) : null}
    </div>
  );
}
