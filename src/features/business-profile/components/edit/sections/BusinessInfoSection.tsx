'use client';

import React from 'react';
import { Input, TextArea } from '@/components/shared';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';

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
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Business Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Business Name"
          placeholder="Enter your business name"
          value={formData.business_name}
          onChange={value => onInputChange('business_name', value)}
          required
          error={
            errors.some(e => e.includes('Business name'))
              ? 'Business name is required'
              : undefined
          }
        />

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
          label="Service Area"
          placeholder="e.g., Local Area, City Wide"
          value={formData.service_area}
          onChange={value => onInputChange('service_area', value)}
          required
          error={
            errors.some(e => e.includes('Service area'))
              ? 'Service area is required'
              : undefined
          }
        />

        <div className="md:col-span-2">
          <TextArea
            label="Business Description"
            placeholder="Tell customers about your business, your experience, and what makes you unique..."
            value={formData.bio}
            onChange={value => onInputChange('bio', value)}
            rows={4}
          />
          <p className="text-sm text-gray-400 mt-2">
            {formData.bio.length}/500 characters
          </p>
        </div>
      </div>
    </div>
  );
};
