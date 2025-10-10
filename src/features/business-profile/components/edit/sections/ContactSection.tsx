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
  const formatPhoneForDisplay = (phone: string): string => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
          Contact Information
        </h2>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Specify how customers should reach you for bookings and inquiries.
        </p>
      </div>

      {/* Main Content Container - matching Step 5 layout */}
      <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-2 sm:p-4 lg:p-6 space-y-6 sm:space-y-8">
        {/* Phone Number for Calls */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 sm:p-6">
          <div className="flex items-center mb-4 sm:mb-6 border-b border-neutral-800 pb-3 sm:pb-4">
            <PhoneIcon className="h-6 w-6 sm:h-7 sm:w-7 text-orange-400 mr-3 sm:mr-4" />
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Primary Phone for Voice Calls
            </h3>
          </div>
          <PhoneInput
            label="Call Phone Number (10 Digits)"
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
          <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
            Customers tap this to initiate a voice call with your business.
          </p>
        </div>

        {/* Same Phone Checkbox - Only show when not checked */}
        {!formData.same_phone_for_both && (
          <div className="p-3 sm:p-4 bg-neutral-900 border border-neutral-700 rounded-xl">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.same_phone_for_both}
                onChange={e => onSamePhoneChange(e.target.checked)}
                className="w-5 h-5 sm:w-6 sm:h-6 appearance-none rounded-md border-2 border-neutral-600 bg-neutral-800 hover:border-orange-400 transition duration-200"
              />
              <span className="ml-4 sm:ml-5 text-white font-medium text-sm sm:text-base">
                Use the same number for both calls and texts
              </span>
            </label>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 ml-9 sm:ml-10">
              Check this box if you want to use one phone number for everything.
            </p>
          </div>
        )}

        {/* Same Phone Confirmation - Show when checked */}
        {formData.same_phone_for_both && (
          <div className="p-3 sm:p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 border border-orange-500 rounded-md flex items-center justify-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
                <span className="ml-4 sm:ml-5 text-orange-400 font-medium text-sm sm:text-base">
                  Using the same number for both calls and texts
                </span>
              </div>
              <button
                onClick={() => onSamePhoneChange(false)}
                className="text-orange-400 hover:text-orange-300 underline text-sm font-medium"
              >
                Change
              </button>
            </div>
            <p className="text-xs sm:text-sm text-orange-300/70 mt-2 ml-9 sm:ml-10">
              Both call and text buttons will use your primary phone number.
            </p>
          </div>
        )}

        {/* Phone Number for Texts (Conditional) */}
        {!formData.same_phone_for_both && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6 border-b border-neutral-800 pb-3 sm:pb-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 sm:h-7 sm:w-7 text-orange-400 mr-3 sm:mr-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Dedicated Number for Text Messages
              </h3>
            </div>
            <PhoneInput
              label="Text Phone Number (10 Digits)"
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
            <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
              Customers can send text messages to this number for quick
              inquiries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
