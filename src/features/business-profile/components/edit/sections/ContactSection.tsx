'use client';

import { PhoneInput } from '@/components/shared';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

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
  // const formatPhoneForDisplay = (phone: string): string => {
  //   if (phone.length === 10) {
  //     return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  //   }
  //   return phone;
  // };

  return (
    <div className="space-y-6">
      {/* Section Header - More Prominent */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 border-l-4 border-orange-400 pl-3">
          Contact Information
        </h2>
        <p className="text-sm sm:text-base text-gray-400">
          How customers should reach you for bookings and inquiries
        </p>
      </div>

      {/* Phone Numbers Grid */}
      <div className="space-y-6">
        {/* Primary Phone */}
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-500/20 rounded-full p-2">
              <PhoneIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Primary Phone</h3>
              <p className="text-xs text-gray-400">For voice calls</p>
            </div>
          </div>
          <PhoneInput
            label="Phone Number"
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

        {/* Same Phone Option */}
        {!formData.same_phone_for_both && (
          <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/50">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.same_phone_for_both}
                onChange={e => onSamePhoneChange(e.target.checked)}
                className="w-5 h-5 appearance-none rounded border-2 border-neutral-600 bg-neutral-800 hover:border-orange-400 transition duration-200"
              />
              <span className="ml-3 text-white font-medium">
                Use same number for calls and texts
              </span>
            </label>
          </div>
        )}

        {/* Same Phone Confirmation */}
        {formData.same_phone_for_both && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-orange-500 border border-orange-500 rounded flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="ml-3 text-orange-400 font-medium">
                  Using same number for calls and texts
                </span>
              </div>
              <button
                onClick={() => onSamePhoneChange(false)}
                className="text-orange-400 hover:text-orange-300 underline text-sm"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Text Phone (Conditional) */}
        {!formData.same_phone_for_both && (
          <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-500/20 rounded-full p-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Text Phone</h3>
                <p className="text-xs text-gray-400">For text messages</p>
              </div>
            </div>
            <PhoneInput
              label="Phone Number"
              value={formData.phone_number_text}
              onChange={value => onInputChange('phone_number_text', value)}
              placeholder="(555) 987-6543"
              required
              error={
                errors.some(e => e.includes('Text phone number'))
                  ? 'Text phone number is required'
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
