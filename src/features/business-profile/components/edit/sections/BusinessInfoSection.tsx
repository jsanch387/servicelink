'use client';

import { Input, TextArea } from '@/components/shared';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import React from 'react';

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
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
          Business Information
        </h2>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
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
        <Input
          label="Business Type"
          placeholder="e.g., Auto Detailing, Car Wash"
          value={formData.business_type}
          onChange={value => onInputChange('business_type', value)}
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
        label="Business Description (Optional)"
        placeholder="Briefly describe your business, services, and what makes you unique. This will be the first thing customers read!"
        value={formData.bio}
        onChange={value => onInputChange('bio', value)}
        rows={5}
      />
    </div>
  );
};
