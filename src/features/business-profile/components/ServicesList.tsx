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
}

export const ServicesList: React.FC<ServicesListProps> = ({
  businessProfile,
  editMode: _editMode,
  onSave: _onSave,
  onCancel: _onCancel,
}) => {
  const services = businessProfile.services || [];
  const hasServices = services && services.length > 0;

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
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState type="services" showEditButton={false} />
      )}
    </section>
  );
};
