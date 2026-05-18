'use client';

import { Input, Select, TextArea } from '@/components/shared';
import { BUSINESS_BIO_MAX_LENGTH } from '@/features/business-profile/constants/businessBio';
import { BUSINESS_TYPE_OPTIONS } from '@/constants/businessTypes';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import React from 'react';

const parseServiceArea = (
  serviceArea: string
): { city: string; state: string } => {
  const [rawCity = '', rawState = ''] = serviceArea.split(',');
  return {
    city: rawCity.trim(),
    state: rawState.trim().toUpperCase().slice(0, 2),
  };
};

const sanitizeCity = (value: string): string =>
  value
    .replace(/[^A-Za-z\s'.-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();

const sanitizeState = (value: string): string =>
  value
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 2);

interface BusinessInfoSectionProps {
  formData: EditingFormData;

  onInputChange: (field: string, value: string) => void;
  errors: string[];
}

export const BusinessInfoSection: React.FC<BusinessInfoSectionProps> = ({
  formData,
  onInputChange,
  errors,
}) => {
  const { city, state } = parseServiceArea(formData.service_area);

  const updateServiceArea = (nextCity: string, nextState: string) => {
    const trimmedCity = nextCity.trim();
    const trimmedState = nextState.trim();

    if (!trimmedCity && !trimmedState) {
      onInputChange('service_area', '');
      return;
    }

    if (trimmedCity && trimmedState) {
      onInputChange('service_area', `${trimmedCity}, ${trimmedState}`);
      return;
    }

    onInputChange('service_area', trimmedCity || trimmedState);
  };

  const handleCityChange = (value: string) => {
    updateServiceArea(sanitizeCity(value), state);
  };

  const handleStateChange = (value: string) => {
    updateServiceArea(city, sanitizeState(value));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          Business Information
        </h2>
        <p className="text-sm sm:text-base text-gray-400">
          Tell customers about your business and what makes you unique in your
          industry.
        </p>
      </div>

      {/* Business Name (Required) */}
      <Input
        label="Business Name"
        placeholder="e.g., Stellar Digital Marketing"
        value={formData.business_name}
        onChange={value => onInputChange('business_name', value)}
        required
        error={
          errors.some(e => e.includes('Business name'))
            ? 'Business name is required'
            : undefined
        }
      />

      {/* Business Type + Service Area (City/State) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Select
          label="Business Type"
          placeholder="Pick one"
          value={formData.business_type}
          onChange={value => onInputChange('business_type', value)}
          options={BUSINESS_TYPE_OPTIONS}
          required
          error={
            errors.some(e => e.includes('Business type'))
              ? 'Business type is required'
              : undefined
          }
        />

        <Input
          label="City (Optional)"
          placeholder="e.g., Austin"
          value={city}
          onChange={handleCityChange}
          error={
            errors.some(e => e.includes('Service area'))
              ? 'Use city + 2-letter state code'
              : undefined
          }
        />

        <Input
          label="State (Optional)"
          placeholder="TX"
          value={state}
          onChange={handleStateChange}
          maxLength={2}
          inputMode="text"
          error={
            errors.some(e => e.includes('Service area'))
              ? 'Use 2 letters only (example: TX)'
              : undefined
          }
        />
      </div>

      {/* Bio */}
      <TextArea
        label="Business Bio (Optional)"
        placeholder="Briefly describe your business, services, and what makes you unique. This appears on your public profile and is often the first thing customers read."
        value={formData.bio}
        onChange={value => onInputChange('bio', value)}
        rows={6}
        maxLength={BUSINESS_BIO_MAX_LENGTH}
        hideCharCount={formData.bio.length < BUSINESS_BIO_MAX_LENGTH}
      />
    </div>
  );
};
