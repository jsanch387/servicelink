'use client';

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
}

export const ServicesList: React.FC<ServicesListProps> = ({
  businessProfile,
  editMode: _editMode,
  onSave: _onSave,
  onCancel: _onCancel,
  isPublic = false,
  publicOwnerHasProForPriceOptions = false,
}) => {
  const services = businessProfile.services || [];
  const hasServices = services && services.length > 0;
  const businessSlug =
    'business_slug' in businessProfile
      ? businessProfile.business_slug || ''
      : '';

  const allowPriceOptionSignals =
    !isPublic || publicOwnerHasProForPriceOptions === true;

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-8">
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
            />
          ))}
        </div>
      ) : (
        <EmptyState type="services" showEditButton={false} />
      )}
    </section>
  );
};
