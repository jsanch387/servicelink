'use client';

import { GlassCard, Input, Select, TextArea } from '@/components/shared';
import { BUSINESS_BIO_MAX_LENGTH } from '@/features/business-profile/constants/businessBio';
import { BUSINESS_TYPE_OPTIONS } from '@/constants/businessTypes';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import {
  formatServiceArea,
  parseServiceAreaCityState,
} from '@/features/business-profile/utils/businessLocation';
import React from 'react';
import { ProfileLocationFields } from '../../ProfileLocationFields';

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
  const { city, state } = parseServiceAreaCityState(formData.service_area);

  const updateServiceArea = (nextCity: string, nextState: string) => {
    onInputChange('service_area', formatServiceArea(nextCity, nextState));
  };

  return (
    <div className="w-full max-w-full space-y-6 text-left">
      <div>
        <p className="text-sm font-medium text-gray-200">Business</p>
        <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Name"
                placeholder="Your business name"
                value={formData.business_name}
                onChange={value => onInputChange('business_name', value)}
                required
                error={
                  errors.some(e => e.includes('Business name'))
                    ? 'Required'
                    : undefined
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                label="Type"
                placeholder="Select type"
                value={formData.business_type}
                onChange={value => onInputChange('business_type', value)}
                options={BUSINESS_TYPE_OPTIONS}
                required
                error={
                  errors.some(e => e.includes('Business type'))
                    ? 'Required'
                    : undefined
                }
              />
            </div>
          </div>
        </GlassCard>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-200">Location</p>
        <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
          <ProfileLocationFields
            city={city}
            state={state}
            zip={formData.business_zip}
            onCityChange={nextCity => updateServiceArea(nextCity, state)}
            onStateChange={nextState => updateServiceArea(city, nextState)}
            onZipChange={zip => onInputChange('business_zip', zip)}
            errors={errors}
          />
        </GlassCard>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-200">Bio</p>
        <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
          <TextArea
            placeholder="A few sentences about your business."
            value={formData.bio}
            onChange={value => onInputChange('bio', value)}
            rows={3}
            maxLength={BUSINESS_BIO_MAX_LENGTH}
            hideCharCount={formData.bio.length < BUSINESS_BIO_MAX_LENGTH}
            error={
              errors.find(e => e.toLowerCase().includes('bio')) ?? undefined
            }
          />
        </GlassCard>
      </div>
    </div>
  );
};
