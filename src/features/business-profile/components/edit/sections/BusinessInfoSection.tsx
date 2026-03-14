'use client';

import { BUSINESS_TYPE_OPTIONS } from '@/constants/businessTypes';
import { Input, Select, TextArea } from '@/components/shared';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import React from 'react';

interface BusinessInfoSectionProps {
  formData: EditingFormData;
  // eslint-disable-next-line no-unused-vars
  onInputChange: (field: string, value: string) => void;
  errors: string[];
}

export const BusinessInfoSection: React.FC<BusinessInfoSectionProps> = ({
  formData,
  onInputChange,
  errors,
}) => {
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

      {/* Business Type & Service Area (Grid Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
          label="Service Area (Optional)"
          placeholder="e.g., Austin, TX, or Remote"
          value={formData.service_area}
          onChange={value => onInputChange('service_area', value)}
        />
      </div>

      {/* Bio */}
      <TextArea
        label="Business Bio (Optional)"
        placeholder="Briefly describe your business, services, and what makes you unique. This appears on your public profile and is often the first thing customers read."
        value={formData.bio}
        onChange={value => onInputChange('bio', value)}
        rows={5}
        maxLength={280}
      />
    </div>
  );
};
