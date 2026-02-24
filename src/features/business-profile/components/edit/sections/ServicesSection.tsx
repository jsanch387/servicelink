'use client';

import {
  Button,
  Input,
  PriceInput,
  Select,
  TextArea,
} from '@/components/shared';
import { ServiceFormData } from '@/features/business-profile/types/businessProfile';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface ServicesSectionProps {
  services: ServiceFormData[];
  // eslint-disable-next-line no-unused-vars
  onServicesChange: (services: ServiceFormData[]) => void;
}

const HOURS_OPTIONS = [
  { value: '', label: 'Select hours' },
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
  { value: '4', label: '4 hours' },
  { value: '5', label: '5 hours' },
  { value: '6', label: '6 hours' },
  { value: '7', label: '7 hours' },
  { value: '8', label: '8 hours' },
  { value: '9', label: '9 hours' },
  { value: '10', label: '10+ hours' },
];

// Character limits - matching onboarding Step 3
const MAX_DESCRIPTION_LENGTH = 280;
const MAX_PRICE_LENGTH = 8; // Max 8 digits for price (e.g., 999999.99)

// Simple Service Card Component - matching onboarding Step 3
const ServiceCard = ({
  service,
  onDelete,
}: {
  service: ServiceFormData;
  onDelete: () => void;
}) => (
  <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-5 bg-neutral-900 rounded-xl transition duration-300 hover:bg-neutral-700/50 group border border-neutral-800 hover:border-orange-400/50">
    {/* Service icon */}
    <div className="p-1.5 sm:p-2 rounded-full bg-orange-900/40 border border-orange-500/20 flex-shrink-0">
      <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold block text-sm sm:text-base leading-tight">
            {service.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 block leading-relaxed mt-1">
            {service.description || 'No description provided'}
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs font-medium">
            {service.price && (
              <span className="text-orange-400">
                Price: <span className="text-white">${service.price}</span>
              </span>
            )}
            {service.hours_to_complete && (
              <span className="text-gray-500">
                Time:{' '}
                <span className="text-white">
                  {service.hours_to_complete}{' '}
                  {service.hours_to_complete === 1 ? 'hour' : 'hours'}
                </span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-500 hover:text-red-400 transition duration-150 p-1 rounded-full hover:bg-red-900/20 flex-shrink-0 ml-2"
          title="Remove service"
        >
          <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  </div>
);

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onServicesChange,
}) => {
  const [currentService, setCurrentService] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: '',
    hours_to_complete: null,
  });

  const handleServiceChange = (
    field: keyof ServiceFormData,
    value: string | number | null
  ) => {
    console.log(`📝 Service ${field} changed:`, value);
    setCurrentService(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (
      !currentService.name.trim() ||
      !currentService.price.trim() ||
      currentService.hours_to_complete == null ||
      currentService.hours_to_complete < 1
    ) {
      return;
    }

    const serviceToAdd: ServiceFormData = {
      ...currentService,
      id: `temp-${Date.now()}`,
    };

    console.log('➕ Adding service:', serviceToAdd);
    onServicesChange([...services, serviceToAdd]);

    // Reset form
    setCurrentService({
      name: '',
      description: '',
      price: '',
      hours_to_complete: null,
    });
  };

  const removeService = (index: number) => {
    console.log('🗑️ Removing service at index:', index);
    onServicesChange(services.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Section Header - More Prominent */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 border-l-4 border-orange-400 pl-3">
          Services & Pricing
        </h2>
        <p className="text-sm sm:text-base text-gray-400">
          Add your services and pricing information
        </p>
      </div>

      {/* Add Service Form */}
      <div className="space-y-4">
        <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
          <PlusIcon className="h-4 w-4 text-orange-400" />
          Add New Service
        </h3>

        <form className="space-y-4">
          <Input
            label="Service Name"
            placeholder="e.g., House Cleaning, Logo Design, Car Repair"
            value={currentService.name}
            onChange={value => handleServiceChange('name', value)}
            required
          />

          <div className="space-y-2">
            <TextArea
              label="Description (Required)"
              placeholder="Tell customers what they get. Keep it simple."
              value={currentService.description}
              onChange={value => handleServiceChange('description', value)}
              rows={3}
              required
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Describe what customers get with this service</span>
              <span
                className={`${
                  currentService.description.length >
                  MAX_DESCRIPTION_LENGTH * 0.9
                    ? 'text-orange-400'
                    : 'text-gray-500'
                }`}
              >
                {currentService.description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <PriceInput
                label="Price (Required)"
                placeholder="0.00"
                value={currentService.price}
                onChange={value => handleServiceChange('price', value)}
                required
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Enter price in dollars (e.g., 150.00)</span>
                <span
                  className={`${
                    currentService.price.length > MAX_PRICE_LENGTH * 0.8
                      ? 'text-orange-400'
                      : 'text-gray-500'
                  }`}
                >
                  {currentService.price.length}/{MAX_PRICE_LENGTH}
                </span>
              </div>
            </div>

            <Select
              label="Duration (Required)"
              placeholder="Select hours"
              value={currentService.hours_to_complete?.toString() || ''}
              onChange={value => {
                const numValue = value ? parseInt(value) : null;
                handleServiceChange('hours_to_complete', numValue);
              }}
              options={HOURS_OPTIONS}
              required
            />
          </div>

          <Button
            type="button"
            onClick={addService}
            variant="primary"
            className="w-full mt-4"
            disabled={
              !currentService.name.trim() ||
              !currentService.hours_to_complete ||
              currentService.hours_to_complete < 1
            }
          >
            Add This Service
          </Button>
        </form>
      </div>

      {/* Services List */}
      <div className="space-y-4 mt-6">
        <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
          <span className="text-orange-400">●</span> Your Services (
          {services.length})
        </h3>

        {services.length === 0 ? (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 text-center border-dashed">
            <PlusIcon className="h-8 w-8 text-orange-400 mx-auto mb-3 opacity-60" />
            <p className="text-gray-400 mb-2 font-medium text-sm">
              No services yet
            </p>
            <p className="text-xs text-gray-500">
              Add your first service using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id || index}
                service={service}
                onDelete={() => removeService(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
