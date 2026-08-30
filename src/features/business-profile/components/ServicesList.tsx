'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { PublicBookingPolicyAgreeDialog } from '@/features/availability/booking/components/BookingPolicyAgreeModal';
import { usePublicBookingPolicyAgreement } from '@/features/availability/booking/hooks/usePublicBookingPolicyAgreement';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import { filterServicesByCategoryFilter } from '@/features/services/categories/utils/filterServicesByCategoryFilter';
import React, { useEffect, useMemo, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { resolvePublicBookingPolicy } from '../utils/bookingPolicy';
import { EmptyState } from './EmptyState';
import { PublicServiceCategoryFilters } from './PublicServiceCategoryFilters';
import { ServiceCard } from './ServiceCard';

interface ServicesListProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isPublic?: boolean;
  /**
   * When viewing the public profile, only show multi-price / “starting at” UI
   * if the owner still has Pro (matches booking flow).
   */
  publicOwnerHasProForPriceOptions?: boolean;
  /**
   * Public profile: hide “Select” on service cards (e.g. free lifetime booking cap).
   */
  publicHideBookLinks?: boolean;
  /** Tighter top padding when a one-line notice sits directly above this list. */
  compactTopPadding?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Live sale — shows struck-through prices on eligible service cards. */
  publicActiveSale?: PublicActiveSale | null;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  businessProfile,
  editMode: _editMode,
  onSave: _onSave,
  onCancel: _onCancel,
  isPublic = false,
  publicOwnerHasProForPriceOptions = false,
  publicHideBookLinks = false,
  compactTopPadding = false,
  bookingFlowLocale = 'en',
  publicActiveSale = null,
}) => {
  const router = useRouter();
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
  const publicBookingPolicy = isPublic
    ? resolvePublicBookingPolicy(businessProfile)
    : null;
  const policyAgreement = usePublicBookingPolicyAgreement({
    businessSlug,
    policyText: publicBookingPolicy?.text,
    skip: !isPublic,
  });

  const allowPriceOptionSignals =
    !isPublic || publicOwnerHasProForPriceOptions === true;

  const sectionY =
    compactTopPadding === true ? 'pt-2 pb-6 sm:pt-3 sm:pb-8' : 'py-4 sm:py-5';

  return (
    <section className={`px-4 sm:px-8 ${sectionY}`}>
      {hasServices ? (
        <div>
          {showCategoryFilters ? (
            <PublicServiceCategoryFilters
              options={categoryOptions}
              value={activeCategoryFilter}
              onChange={setActiveCategoryFilter}
              ariaLabel={bookingUi.profile.serviceCategoriesAriaLabel}
            />
          ) : null}

          {displayServices.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-4 ${
                showCategoryFilters ? 'mt-3' : ''
              }`}
            >
              {displayServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={{
                    id: service.id,
                    name: service.name,
                    description: service.description || '',
                    price: service.price_cents || 0,
                    hours_to_complete: service.hours_to_complete || null,
                    duration_minutes: service.duration_minutes ?? null,
                    priceOptionsEnabled:
                      service.price_options_enabled === true &&
                      allowPriceOptionSignals,
                  }}
                  isEditable={false}
                  isPublic={isPublic}
                  businessSlug={businessSlug}
                  hideBookLink={publicHideBookLinks}
                  bookingFlowLocale={bookingFlowLocale}
                  publicActiveSale={publicActiveSale}
                  onSelectNavigate={
                    policyAgreement.required && !policyAgreement.hasAgreed
                      ? href =>
                          policyAgreement.runAfterAgreement(() =>
                            router.push(href)
                          )
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-8">
              {bookingUi.profile.noServicesInCategory}
            </p>
          )}
        </div>
      ) : (
        <EmptyState type="services" showEditButton={false} />
      )}
      <PublicBookingPolicyAgreeDialog
        isOpen={policyAgreement.modalOpen}
        required={policyAgreement.required}
        policyText={policyAgreement.policyText}
        onClose={policyAgreement.dismiss}
        onAgreed={policyAgreement.agree}
        bookingFlowLocale={bookingFlowLocale}
      />
    </section>
  );
};
