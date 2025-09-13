'use client';

import React from 'react';
import { PhoneInput } from '@/components/shared';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';

interface ContactSectionProps {
  formData: EditingFormData;
  onInputChange: (field: string, value: string) => void;
  onSamePhoneChange: (checked: boolean) => void;
  errors: string[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  formData,
  onInputChange,
  onSamePhoneChange,
  errors,
}) => {
  const formatPhoneForDisplay = (phone: string): string => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Contact Information
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <PhoneInput
              label="Call Phone"
              value={formData.phone_number_call}
              onChange={value => onInputChange('phone_number_call', value)}
              placeholder="(555) 123-4567"
              required
              error={
                errors.some(e => e.includes('Call phone number'))
                  ? 'Call phone number is required'
                  : undefined
              }
            />
          </div>

          <div>
            <PhoneInput
              label="Text Phone"
              value={formData.phone_number_text}
              onChange={value => onInputChange('phone_number_text', value)}
              placeholder="(555) 123-4567"
              required
              disabled={formData.same_phone_for_both}
              error={
                errors.some(e => e.includes('Text phone number'))
                  ? 'Text phone number is required'
                  : undefined
              }
            />
          </div>
        </div>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.same_phone_for_both}
            onChange={e => onSamePhoneChange(e.target.checked)}
            className="w-4 h-4 text-orange-500 bg-neutral-700 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
          />
          <span className="ml-3 text-white text-sm">
            Use same number for calls and texts
          </span>
        </label>
      </div>
    </div>
  );
};
