'use client';

import { GlassCard, Input, Select, TextArea } from '@/components/shared';
import { getSpecialtiesForBusinessType } from '@/constants/businessSpecialties';
import { getBusinessTypeSelectOptions } from '@/constants/businessTypes';
import { BUSINESS_BIO_MAX_LENGTH } from '@/features/business-profile/constants/businessBio';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import type { StructuredLocation } from '@/features/location/types/location';
import React from 'react';
import { DashboardProfileCoverageCard } from '../../DashboardProfileCoverageCard';
import { SpecialtyChips } from '../../SpecialtyChips';
import { coverageErrorFromMessages } from '../../../utils/primaryServiceArea';

interface BusinessInfoSectionProps {
  formData: EditingFormData;
  onInputChange: (field: string, value: string) => void;
  onBusinessTypeChange: (value: string) => void;
  onSpecialtiesChange: (next: string[]) => void;
  errors: string[];
  locationQuery: string;
  onLocationQueryChange: (value: string) => void;
  selectedLocation: StructuredLocation | null;
  onSelectLocation: (location: StructuredLocation) => void;
  radiusMiles: number;
  onRadiusChange: (miles: number) => void;
}

export const BusinessInfoSection: React.FC<BusinessInfoSectionProps> = ({
  formData,
  onInputChange,
  onBusinessTypeChange,
  onSpecialtiesChange,
  errors,
  locationQuery,
  onLocationQueryChange,
  selectedLocation,
  onSelectLocation,
  radiusMiles,
  onRadiusChange,
}) => {
  const coverageError = coverageErrorFromMessages(errors);
  const specialtyOptions = formData.business_type
    ? getSpecialtiesForBusinessType(formData.business_type)
    : [];
  const specialtyError = errors.find(message =>
    message.toLowerCase().includes('hire you')
  );

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
                label="What type of business is this?"
                placeholder="Pick one"
                value={formData.business_type}
                onChange={onBusinessTypeChange}
                options={getBusinessTypeSelectOptions(formData.business_type)}
                required
                error={
                  errors.some(e => e.includes('Business type'))
                    ? 'Required'
                    : undefined
                }
              />
            </div>
            {specialtyOptions.length > 0 ? (
              <div className="sm:col-span-2">
                <SpecialtyChips
                  options={specialtyOptions}
                  value={formData.specialties}
                  onChange={onSpecialtiesChange}
                  error={specialtyError}
                />
              </div>
            ) : null}
          </div>
        </GlassCard>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-200">Location</p>
        <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
          <DashboardProfileCoverageCard
            locationQuery={locationQuery}
            onLocationQueryChange={onLocationQueryChange}
            selectedLocation={selectedLocation}
            onSelectLocation={onSelectLocation}
            radiusMiles={radiusMiles}
            onRadiusChange={onRadiusChange}
            error={coverageError}
          />
        </GlassCard>
      </div>

      <TextArea
        label="Bio"
        placeholder="A few sentences about your business."
        value={formData.bio}
        onChange={value => onInputChange('bio', value)}
        rows={4}
        maxLength={BUSINESS_BIO_MAX_LENGTH}
        hideCharCount={formData.bio.length < BUSINESS_BIO_MAX_LENGTH}
        inputClassName="rounded-xl"
        error={errors.find(e => e.toLowerCase().includes('bio')) ?? undefined}
      />
    </div>
  );
};
