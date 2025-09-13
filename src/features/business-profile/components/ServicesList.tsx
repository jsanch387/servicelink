'use client';

import React from 'react';
import { TagIcon } from '@heroicons/react/24/solid';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { ServiceCard } from './ServiceCard';
import { EmptyState } from './EmptyState';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { formatPrice } from '../utils/businessProfileHelpers';

interface ServicesListProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  businessProfile,
  editMode,
  onSave,
  onCancel,
}) => {
  const services = businessProfile.services || [];
  const hasServices = services && services.length > 0;

  return (
    <section className="px-6 py-8 sm:px-8 bg-neutral-800">
      <SectionTitle icon={<TagIcon className="h-7 w-7 text-gray-50" />}>
        Services & Pricing
      </SectionTitle>

      {hasServices ? (
        <>
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .custom-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4 custom-scrollbar">
            {services.map(service => (
              <ServiceCard
                key={service.id}
                service={{
                  id: service.id,
                  name: service.name,
                  description: service.description || '',
                  price: formatPrice(service.price_cents),
                  hours_to_complete: service.hours_to_complete || undefined,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState type="services" showEditButton={false} />
      )}
    </section>
  );
};
