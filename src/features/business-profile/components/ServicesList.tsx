'use client';

import { TagIcon } from '@heroicons/react/24/solid';
import React from 'react';
// import { SectionTitle } from '@/components/shared/SectionTitle'; // Will be used later
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { EmptyState } from './EmptyState';
import { ServiceCard } from './ServiceCard';
// import { formatPrice } from '../utils/businessProfileHelpers'; // Will be used later

interface ServicesListProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: Record<string, unknown>) => Promise<void>;
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
    <section className="px-4 py-8 sm:px-8 sm:py-12 border-b border-neutral-700 bg-neutral-900/90">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <TagIcon className="h-6 w-6 text-orange-500" />
          Services & Pricing
        </h2>
      </div>

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
              <div key={service.id} className="flex-none w-[85%] sm:w-64">
                <ServiceCard
                  service={{
                    id: service.id,
                    name: service.name,
                    description: service.description || '',
                    price: service.price_cents || 0,
                    hours_to_complete: service.hours_to_complete || undefined,
                  }}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState type="services" showEditButton={false} />
      )}
    </section>
  );
};
