'use client';

import { FilterPills } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import { filterServicesByCategoryFilter } from '@/features/services/categories/utils/filterServicesByCategoryFilter';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import {
  BookingLinkV2ServiceBrowseSheet,
  type BookingLinkV2BrowseService,
} from './BookingLinkV2ServiceBrowseSheet';
import { BookingLinkV2ServiceCard } from './BookingLinkV2ServiceCard';

interface BookingLinkV2ServicesSectionProps {
  businessProfile: CompleteBusinessProfile;
  isPublic?: boolean;
  publicOwnerHasProForPriceOptions?: boolean;
  publicHideBookLinks?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  publicActiveSale?: PublicActiveSale | null;
}

export function BookingLinkV2ServicesSection({
  businessProfile,
  isPublic = false,
  publicOwnerHasProForPriceOptions = false,
  publicHideBookLinks = false,
  bookingFlowLocale = 'en',
  publicActiveSale = null,
}: BookingLinkV2ServicesSectionProps) {
  const bookingUi = publicBookingUi(bookingFlowLocale);
  const services = useMemo(
    () => businessProfile.services || [],
    [businessProfile.services]
  );
  const categories = useMemo(
    () => businessProfile.serviceCategories ?? [],
    [businessProfile.serviceCategories]
  );
  const hasServices = services.length > 0;
  const showCategoryFilters = shouldShowPublicServiceCategoryFilters(
    categories,
    services
  );

  const categoryOptions = useMemo(
    () =>
      showCategoryFilters
        ? buildPublicServiceCategoryOptions(
            categories,
            services,
            bookingUi.profile.serviceCategoryOther
          )
        : [],
    [
      showCategoryFilters,
      categories,
      services,
      bookingUi.profile.serviceCategoryOther,
    ]
  );

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('');
  const [browsingService, setBrowsingService] =
    useState<BookingLinkV2BrowseService | null>(null);

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
    return filterServicesByCategoryFilter(services, activeCategoryFilter);
  }, [services, showCategoryFilters, activeCategoryFilter]);

  const businessSlug =
    'business_slug' in businessProfile
      ? businessProfile.business_slug || ''
      : '';

  const allowPriceOptionSignals =
    !isPublic || publicOwnerHasProForPriceOptions === true;

  return (
    <section className="px-4 py-4 sm:px-8 sm:py-5">
      {isPublic && publicHideBookLinks ? (
        <div
          className="mb-3 flex items-center gap-2 text-sm text-zinc-500"
          role="status"
        >
          <InformationCircleIcon
            className="h-4 w-4 shrink-0 text-zinc-500/80"
            aria-hidden
          />
          <span className="leading-snug">
            {bookingUi.profile.notTakingBookingsRightNow}
          </span>
        </div>
      ) : null}

      {hasServices ? (
        <div>
          {showCategoryFilters ? (
            <div className="mb-4">
              <FilterPills
                options={categoryOptions}
                value={activeCategoryFilter}
                onChange={setActiveCategoryFilter}
                ariaLabel={bookingUi.profile.serviceCategoriesAriaLabel}
                horizontalScroll
              />
            </div>
          ) : null}

          {displayServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {displayServices.map(service => (
                <BookingLinkV2ServiceCard
                  key={service.id}
                  service={{
                    id: service.id,
                    name: service.name,
                    price: service.price_cents || 0,
                    hours_to_complete: service.hours_to_complete || null,
                    duration_minutes: service.duration_minutes ?? null,
                    priceOptionsEnabled:
                      service.price_options_enabled === true &&
                      allowPriceOptionSignals,
                    image_path: service.image_path,
                  }}
                  isPublic={isPublic}
                  businessSlug={businessSlug}
                  hideBookLink={publicHideBookLinks}
                  onBrowse={
                    !publicHideBookLinks && businessSlug && service.id
                      ? () =>
                          setBrowsingService({
                            id: service.id,
                            name: service.name,
                            description: service.description,
                            price: service.price_cents || 0,
                            duration_minutes: service.duration_minutes ?? null,
                            hours_to_complete: service.hours_to_complete || null,
                            priceOptionsEnabled:
                              service.price_options_enabled === true &&
                              allowPriceOptionSignals,
                          })
                      : undefined
                  }
                  bookingFlowLocale={bookingFlowLocale}
                  publicActiveSale={publicActiveSale}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              {bookingUi.profile.noServicesInCategory}
            </p>
          )}
        </div>
      ) : (
        <EmptyState type="services" showEditButton={false} />
      )}

      {businessSlug ? (
        <BookingLinkV2ServiceBrowseSheet
          service={browsingService}
          businessSlug={businessSlug}
          bookingFlowLocale={bookingFlowLocale}
          onClose={() => setBrowsingService(null)}
        />
      ) : null}
    </section>
  );
}
