'use client';

import { GlassCard, PhoneInput } from '@/components/shared';
import React from 'react';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';

interface ContactSectionProps {
  formData: EditingFormData;
  onInputChange: (field: string, value: string) => void;
  errors: string[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  formData,
  onInputChange,
  errors,
}) => {
  const phoneError = errors.some(e => e.includes('phone number'))
    ? 'Please enter a valid 10-digit phone number'
    : undefined;

  return (
    <div className="w-full max-w-full text-left">
      <p className="text-sm font-medium text-gray-200">Phone</p>
      <p className="mt-1 text-xs text-zinc-500">
        Optional. Shown on your profile so customers can call you.
      </p>

      <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
        <PhoneInput
          label="Number"
          value={formData.phone_number_call}
          onChange={value => onInputChange('phone_number_call', value)}
          placeholder="(555) 123-4567"
          showIcon
          showDigitHint
          error={phoneError}
        />
      </GlassCard>
    </div>
  );
};
