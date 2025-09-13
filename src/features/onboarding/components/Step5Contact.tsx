'use client';

import React, { useState, useEffect } from 'react';
import { Button, PhoneInput } from '@/components/shared';
import { BusinessProfileService } from '../services/businessProfileService';
import { ContactFormData, ContactExistingData } from '../types/contact';
import {
  completeOnboarding,
  saveStepAndProgress,
} from '../utils/onboardingHelpers';
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Contact Information
        </h1>
        <p className="text-xl text-gray-300">How can customers reach you?</p>
        <p className="text-sm text-gray-400 mt-2">
          Customers will be able to call or text you directly
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Call Phone Number */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <PhoneIcon className="h-6 w-6 text-orange-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">
              Phone Number for Calls
            </h2>
          </div>
          <PhoneInput
            label="Call Phone Number"
            value={formData.phoneCall}
            onChange={handlePhoneCallChange}
            placeholder="(555) 123-4567"
            required
            disabled={isLoading}
          />
          <p className="text-sm text-gray-400 mt-2">
            Customers can tap this number to call you directly
          </p>
        </div>

        {/* Text Phone Number */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-orange-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">
              Phone Number for Texts
            </h2>
          </div>
          <PhoneInput
            label="Text Phone Number"
            value={formData.phoneText}
            onChange={handlePhoneTextChange}
            placeholder="(555) 123-4567"
            required
            disabled={isLoading || formData.samePhoneForBoth}
          />
          <p className="text-sm text-gray-400 mt-2">
            Customers can tap this number to send you a text message
          </p>
        </div>

        {/* Same Phone Checkbox */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.samePhoneForBoth}
              onChange={e => handleSamePhoneChange(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-orange-500 bg-neutral-700 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
            />
            <span className="ml-3 text-white">
              Use the same phone number for both calls and texts
            </span>
          </label>
          <p className="text-sm text-gray-400 mt-2 ml-7">
            Check this if you want customers to use the same number for calling
            and texting
          </p>
        </div>

        {/* Preview */}
        {(formData.phoneCall || formData.phoneText) && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-white">Call:</span>
                </div>
                <span className="text-gray-300 font-mono">
                  {formData.phoneCall
                    ? formatPhoneForDisplay(formData.phoneCall)
                    : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-white">Text:</span>
                </div>
                <span className="text-gray-300 font-mono">
                  {formData.phoneText
                    ? formatPhoneForDisplay(formData.phoneText)
                    : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t border-neutral-700">
        <Button
          onClick={onBack}
          variant="secondary"
          className="sm:w-auto"
          disabled={isLoading}
        >
          Back
        </Button>

        <div className="flex gap-4 flex-1">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Skip for now
          </Button>

          <Button
            onClick={handleComplete}
            variant="primary"
            className="flex-1"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Completing...' : 'Complete Setup'}
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-400 text-center mt-6">
        You can always update your contact information later from your dashboard
      </p>
    </div>
  );
};
