'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import React from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { EmptyState } from './EmptyState';
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
}) => {
  const services = businessProfile.services || [];
  const hasServices = services && services.length > 0;
  const businessSlug =
    'business_slug' in businessProfile
      ? businessProfile.business_slug || ''
      : '';

  const allowPriceOptionSignals =
    !isPublic || publicOwnerHasProForPriceOptions === true;

  const sectionY =
    compactTopPadding === true ? 'pt-2 pb-6 sm:pt-3 sm:pb-8' : 'py-6 sm:py-8';

  return (
    <section className={`px-4 sm:px-8 ${sectionY}`}>
      {hasServices ? (
        <div className="grid grid-cols-1 gap-4">
          {services.map(service => (
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
            />
          ))}
        </div>
      ) : (
        <EmptyState type="services" showEditButton={false} />
      )}
    </section>
  );
};
