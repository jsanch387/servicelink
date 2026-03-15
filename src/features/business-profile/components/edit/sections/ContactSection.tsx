'use client';

import { PhoneInput } from '@/components/shared';
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
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
        Contact
      </h2>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-colors">
        <PhoneInput
          label="Phone number"
          value={formData.phone_number_call}
          onChange={value => onInputChange('phone_number_call', value)}
          placeholder="(555) 123-4567"
          showIcon={true}
          showDigitHint={true}
          error={phoneError}
        />
        <p className="text-xs text-gray-500 mt-2">
          Optional. Shown on your profile so customers can call you.
        </p>
      </div>
    </div>
  );
};
