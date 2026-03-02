'use client';

import { PhoneInput } from '@/components/shared';
import { PhoneIcon } from '@heroicons/react/24/outline';
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
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 border-l-4 border-orange-400 pl-3">
          Contact Information
        </h2>
        <p className="text-sm sm:text-base text-gray-400">
          Phone number customers can use to call you
        </p>
      </div>

      <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-orange-500/20 rounded-full p-2">
            <PhoneIcon className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Phone Number</h3>
            <p className="text-xs text-gray-400">
              Optional, but helps customers reach you
            </p>
          </div>
        </div>
        <PhoneInput
          label="Phone Number"
          value={formData.phone_number_call}
          onChange={value => onInputChange('phone_number_call', value)}
          placeholder="(555) 123-4567"
          error={
            errors.some(e => e.includes('phone number'))
              ? 'Please enter a valid 10-digit phone number'
              : undefined
          }
        />
      </div>
    </div>
  );
};
