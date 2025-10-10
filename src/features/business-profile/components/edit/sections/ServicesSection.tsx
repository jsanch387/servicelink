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
  onServicesChange: (services: ServiceFormData[]) => void;
  errors: string[];
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
  errors,
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
    if (!currentService.name.trim() || !currentService.price.trim()) {
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
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
          Services & Pricing
        </h2>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Tell customers what you do and how much it costs. Keep it simple and
          clear.
        </p>
      </div>

      {/* Main Content Grid - stacked layout */}
      <div className="space-y-8 sm:space-y-10">
        {/* Add Service Form */}
        <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-2 sm:p-4 lg:p-6 ">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            Add a Service
          </h3>

          <form className="space-y-4 sm:space-y-6">
            <Input
              label="What do you call this service?"
              placeholder="e.g., House Cleaning, Logo Design, Car Repair"
              value={currentService.name}
              onChange={value => handleServiceChange('name', value)}
              required
            />

            <div className="space-y-2">
              <TextArea
                label="What's included? (Required)"
                placeholder="Tell customers what they get. Keep it simple."
                value={currentService.description}
                onChange={value => handleServiceChange('description', value)}
                rows={3}
                required
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Describe what customers get with this service
                </span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <PriceInput
                  label="How much does it cost? (Required)"
                  placeholder="0.00"
                  value={currentService.price}
                  onChange={value => handleServiceChange('price', value)}
                  required
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Enter price in dollars (e.g., 150.00)
                  </span>
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
                label="How long does it take? (Optional)"
                placeholder="Select hours"
                value={currentService.hours_to_complete?.toString() || ''}
                onChange={value => {
                  const numValue = value ? parseInt(value) : null;
                  handleServiceChange('hours_to_complete', numValue);
                }}
                options={HOURS_OPTIONS}
              />
            </div>

            <Button
              type="button"
              onClick={addService}
              variant="primary"
              className="w-full mt-4 sm:mt-6 text-base sm:text-lg"
              disabled={!currentService.name.trim()}
            >
              Add This Service
            </Button>
          </form>
        </div>

        {/* Services List */}
        <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-2 sm:p-4 lg:p-6 ">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            Your Services ({services.length})
          </h3>

          {services.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 sm:p-8 text-center border-dashed">
              <PlusIcon className="h-8 w-8 sm:h-10 sm:w-10 text-orange-400 mx-auto mb-3 sm:mb-4 opacity-60" />
              <p className="text-gray-400 mb-2 font-semibold text-sm sm:text-base">
                No services yet
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Add your first service using the form on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
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
    </div>
  );
};
