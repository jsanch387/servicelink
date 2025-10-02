'use client';

import { Button, PhoneInput } from '@/components/shared';
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { BusinessProfileService } from '../services/businessProfileService';
import { ContactExistingData, ContactFormData } from '../types/contact';
import {
  completeOnboarding,
  saveStepAndProgress,
} from '../utils/onboardingHelpers';

interface Step5ContactProps {
  profileId: string;
  businessProfileId: string;
  existingData?: ContactExistingData;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Contact: React.FC<Step5ContactProps> = ({
  profileId,
  businessProfileId,
  existingData,
  onNext,
  onBack,
}) => {
  console.log('📞 Step5Contact loaded:', {
    profileId,
    businessProfileId,
    existingData,
  });

  const [formData, setFormData] = useState<ContactFormData>({
    phoneCall: '',
    phoneText: '',
    samePhoneForBoth: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load existing contact data
  useEffect(() => {
    console.log('📝 Loading existing contact data...');

    if (existingData) {
      const phoneCall = existingData.phone_number_call || '';
      const phoneText = existingData.phone_number_text || '';
      const samePhone = phoneCall === phoneText && phoneCall.length > 0;

      setFormData({
        phoneCall,
        phoneText,
        samePhoneForBoth: samePhone,
      });

      console.log('✅ Loaded existing contact data:', {
        phoneCall,
        phoneText,
        samePhone,
      });
    } else {
      console.log('ℹ️ No existing contact data found');
    }
  }, [existingData]);

  // Handle same phone checkbox change
  const handleSamePhoneChange = (checked: boolean) => {
    console.log('📞 Same phone checkbox changed:', checked);

    setFormData(prev => {
      const newData = { ...prev, samePhoneForBoth: checked };

      // If checking "same phone", copy call number to text number
      if (checked && prev.phoneCall) {
        newData.phoneText = prev.phoneCall;
        console.log('📋 Copied call number to text number:', prev.phoneCall);
      }

      return newData;
    });
  };

  // Handle phone call number change
  const handlePhoneCallChange = (value: string) => {
    console.log('📞 Call phone number changed:', value);

    setFormData(prev => {
      const newData = { ...prev, phoneCall: value };

      // If "same phone" is checked, update text number too
      if (prev.samePhoneForBoth) {
        newData.phoneText = value;
        console.log('📋 Auto-updated text number to match call number');
      }

      return newData;
    });
  };

  // Handle phone text number change
  const handlePhoneTextChange = (value: string) => {
    console.log('💬 Text phone number changed:', value);

    setFormData(prev => {
      const newData = { ...prev, phoneText: value };

      // If numbers are different, uncheck "same phone"
      if (prev.samePhoneForBoth && value !== prev.phoneCall) {
        newData.samePhoneForBoth = false;
        console.log('📋 Unchecked "same phone" due to different numbers');
      }

      return newData;
    });
  };

  // Validate form data
  const validateForm = (): { isValid: boolean; error?: string } => {
    if (!formData.phoneCall || formData.phoneCall.length !== 10) {
      return {
        isValid: false,
        error: 'Please enter a valid call phone number',
      };
    }

    if (!formData.phoneText || formData.phoneText.length !== 10) {
      return {
        isValid: false,
        error: 'Please enter a valid text phone number',
      };
    }

    return { isValid: true };
  };

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string): string => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const handleComplete = async () => {
    console.log('🎉 Completing onboarding with contact data:', formData);

    setIsLoading(true);
    setError('');

    try {
      // Validate form
      const validation = validateForm();
      if (!validation.isValid) {
        setError(validation.error || 'Please check your phone numbers');
        setIsLoading(false);
        return;
      }

      // Prepare contact data for database
      const contactData = {
        phone_number_call: formData.phoneCall,
        phone_number_text: formData.phoneText,
      };

      console.log('💾 Saving contact data to business profile:', contactData);

      // Update business profile with contact information
      const businessResult = await BusinessProfileService.updateBusinessProfile(
        businessProfileId,
        contactData
      );

      if (!businessResult.success) {
        console.error(
          '❌ Failed to update business profile:',
          businessResult.error
        );
        setError(businessResult.error || 'Failed to save contact information');
        setIsLoading(false);
        return;
      }

      console.log('✅ Contact data saved to business profile');

      // Complete onboarding
      const completeResult = await completeOnboarding(profileId);
      if (!completeResult.success) {
        console.error(
          '❌ Failed to complete onboarding:',
          completeResult.error
        );
        setError(completeResult.error || 'Failed to complete onboarding');
        setIsLoading(false);
        return;
      }

      console.log('🎉 Onboarding completed successfully!');
      onNext();
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('⏭️ User skipping Step 5');
    setIsLoading(true);

    try {
      const result = await saveStepAndProgress(
        profileId,
        5, // current step
        businessProfileId,
        {},
        true // skipping
      );

      if (!result.success) {
        console.error('❌ Failed to skip Step 5:', result.error);
        setError(result.error || 'Failed to skip step');
        setIsLoading(false);
        return;
      }

      console.log('✅ Skipped Step 5, completing onboarding');

      // Complete onboarding even if skipping contact
      const completeResult = await completeOnboarding(profileId);
      if (!completeResult.success) {
        console.error(
          '❌ Failed to complete onboarding:',
          completeResult.error
        );
        setError(completeResult.error || 'Failed to complete onboarding');
        setIsLoading(false);
        return;
      }

      console.log('🎉 Onboarding completed (skipped contact)');
      onNext();
    } catch (error) {
      console.error('❌ Error skipping Step 5:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">
          Final Step: <span className="text-orange-400">Contact Details</span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-light max-w-3xl mx-auto">
          Specify how customers should reach you for bookings and inquiries.
        </p>
        <p className="text-sm sm:text-base text-gray-500 mt-2 sm:mt-3">
          This information will be displayed on your public business page.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 sm:mb-8 mx-2 sm:mx-0">
          <p className="text-red-400 text-sm font-medium text-center">
            {error}
          </p>
        </div>
      )}

      {/* Main Content Container */}
      <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl mx-2 sm:mx-0 space-y-6 sm:space-y-8">
        {/* Phone Number for Calls */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 sm:p-6">
          <div className="flex items-center mb-4 sm:mb-6 border-b border-neutral-800 pb-3 sm:pb-4">
            <PhoneIcon className="h-6 w-6 sm:h-7 sm:w-7 text-orange-400 mr-3 sm:mr-4" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Primary Phone for Voice Calls
            </h2>
          </div>
          <PhoneInput
            label="Call Phone Number (10 Digits)"
            value={formData.phoneCall}
            onChange={handlePhoneCallChange}
            placeholder="(555) 123-4567"
            required
            disabled={isLoading}
          />
          <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
            Customers tap this to initiate a voice call with your business.
          </p>
        </div>

        {/* Same Phone Checkbox - Only show when not checked */}
        {!formData.samePhoneForBoth && (
          <div className="p-3 sm:p-4 bg-neutral-900 border border-neutral-700 rounded-xl">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.samePhoneForBoth}
                onChange={e => handleSamePhoneChange(e.target.checked)}
                disabled={isLoading}
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
        {formData.samePhoneForBoth && (
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
                onClick={() => handleSamePhoneChange(false)}
                disabled={isLoading}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium underline transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
        {!formData.samePhoneForBoth && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6 border-b border-neutral-800 pb-3 sm:pb-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 sm:h-7 sm:w-7 text-orange-400 mr-3 sm:mr-4" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Dedicated Number for Text Messages
              </h2>
            </div>
            <PhoneInput
              label="Text Phone Number (10 Digits)"
              value={formData.phoneText}
              onChange={handlePhoneTextChange}
              placeholder="(555) 987-6543"
              required
              disabled={isLoading}
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
              Customers tap this to send you a text message for quick
              communication.
            </p>
          </div>
        )}

        {/* Preview Section */}
        {(formData.phoneCall || formData.phoneText) && (
          <div className="pt-6 sm:pt-8 border-t border-neutral-700">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
              Customer Preview
            </h3>
            <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-neutral-900 rounded-xl border border-neutral-700">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-neutral-700/50 rounded-lg shadow-inner">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 mr-3" />
                  <span className="text-gray-300 font-medium text-sm sm:text-base">
                    Call Me:
                  </span>
                </div>
                <span
                  className={`font-mono text-sm sm:text-base ${formData.phoneCall.length === 10 ? 'text-white' : 'text-red-400'}`}
                >
                  {formData.phoneCall.length === 10
                    ? formatPhoneForDisplay(formData.phoneCall)
                    : 'A valid number is required'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-neutral-700/50 rounded-lg shadow-inner">
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 mr-3" />
                  <span className="text-gray-300 font-medium text-sm sm:text-base">
                    Text Me:
                  </span>
                </div>
                <span
                  className={`font-mono text-sm sm:text-base ${formData.phoneText.length === 10 ? 'text-white' : 'text-red-400'}`}
                >
                  {formData.phoneText.length === 10
                    ? formatPhoneForDisplay(formData.phoneText)
                    : 'A valid number is required'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 pt-6 sm:pt-8 mt-8 sm:mt-10 px-4 sm:px-0">
        {/* Back Button */}
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="w-full sm:w-auto px-8 order-2 sm:order-1"
          disabled={isLoading}
        >
          ← Back to Portfolio
        </Button>

        <div className="flex gap-4 w-full sm:w-auto order-1 sm:order-2">
          {/* Skip Button */}
          <Button
            type="button"
            onClick={handleSkip}
            variant="outline"
            className="flex-1 px-6 sm:px-8"
            disabled={isLoading}
          >
            Skip & Complete
          </Button>

          {/* Complete Setup Button */}
          <Button
            type="button"
            onClick={handleComplete}
            variant="primary"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={
              isLoading ||
              formData.phoneCall.length !== 10 ||
              formData.phoneText.length !== 10
            }
            loading={isLoading}
          >
            {isLoading ? 'Completing Setup...' : 'Complete Setup'}
          </Button>
        </div>
      </div>

      <p className="text-sm sm:text-base text-gray-500 text-center mt-6 sm:mt-8 px-4 sm:px-0">
        You're almost there! This is the last step of the initial setup.
      </p>
    </div>
  );
};
