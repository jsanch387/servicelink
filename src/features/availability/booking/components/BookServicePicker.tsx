'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { BookFlowServiceRow } from '@/features/availability/booking/components/BookFlowServiceRow';
import { PublicServiceCategoryFilters } from '@/features/business-profile/components/PublicServiceCategoryFilters';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '@/features/services/categories/types/serviceCategories';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useEffect, useMemo, useState } from 'react';

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
  bookingFlowLocale = 'en',
}: BookServicePickerProps) {
  const ui = publicBookingUi(bookingFlowLocale);

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

  if (services.length === 0) {
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
    <div className={containerClassName}>
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
    </div>
  );
}
