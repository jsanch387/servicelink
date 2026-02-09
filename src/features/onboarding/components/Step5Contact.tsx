'use client';

import { Button, GlassCard, PhoneInput } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import { BusinessProfileService } from '../services/businessProfileService';
import { ContactExistingData } from '../types/contact';
import { saveStepAndProgress } from '../utils/onboardingHelpers';

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
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (existingData?.phone_number_call) {
      setPhone(existingData.phone_number_call);
    }
  }, [existingData]);

  const handleComplete = async () => {
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const contactData = {
        phone_number_call: phone,
        phone_number_text: null,
      };

      const businessResult = await BusinessProfileService.updateBusinessProfile(
        businessProfileId,
        contactData
      );

      if (!businessResult.success) {
        setError(businessResult.error || 'Failed to save contact information');
        setIsLoading(false);
        return;
      }

      onNext();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await saveStepAndProgress(
        profileId,
        5,
        businessProfileId,
        {},
        true
      );

      if (!result.success) {
        setError(result.error || 'Failed to skip step');
        setIsLoading(false);
        return;
      }

      onNext();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const formatPhoneForDisplay = (value: string): string => {
    if (value.length === 10) {
      return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    }
    return value;
  };

  const isValid = phone.length === 10;

  return (
    <div className="max-w-2xl mx-auto text-center sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Final Step: <span className="text-orange-400">Contact</span>
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Add your phone number so customers can call you.
        </p>
      </div>

      <GlassCard
        padding="lg"
        rounded="rounded-2xl"
        blurColor="bg-orange-500"
        showBlur={true}
        className="mb-8 text-left"
      >
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <h2 className="text-base font-semibold text-white mb-6">
          Phone Number
        </h2>

        <PhoneInput
          label="Your phone number (10 digits)"
          value={phone}
          onChange={setPhone}
          placeholder="(555) 123-4567"
          required
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-2">
          Customers will tap this to call you.
        </p>

        {isValid && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-2">Preview</p>
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.04]">
              <span className="text-gray-400 text-sm">Call:</span>
              <span className="font-mono text-white text-sm">
                {formatPhoneForDisplay(phone)}
              </span>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="flex flex-col gap-4 pt-6 sm:pt-8">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="w-full sm:w-auto px-8 order-2 sm:order-1"
          disabled={isLoading}
        >
          ← Back
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
          <Button
            type="button"
            onClick={handleSkip}
            variant="outline"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={isLoading}
          >
            Skip & Complete
          </Button>

          <Button
            type="button"
            onClick={handleComplete}
            variant="primary"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={!isValid || isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        You can change this later in settings.
      </p>
    </div>
  );
};
