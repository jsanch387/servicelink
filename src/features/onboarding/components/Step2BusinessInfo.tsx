'use client';

import {
  Button,
  GlassCard,
  Input,
  Select,
  TextArea,
} from '@/components/shared';
import React, { useEffect, useState } from 'react';
import { saveStepAndProgress } from '../utils/onboardingHelpers';

interface Step2BusinessInfoProps {
  profileId: string;
  businessProfileId: string;
  existingData?: Record<string, unknown>;
  onNext: () => void;
  onBack: () => void;
}

const BUSINESS_TYPES = [
  'Service Provider',
  'Restaurant',
  'Retail Store',
  'Professional Services',
  'Healthcare',
  'Beauty & Wellness',
  'Automotive',
  'Real Estate',
  'Technology',
  'Other',
];

export const Step2BusinessInfo: React.FC<Step2BusinessInfoProps> = ({
  profileId,
  businessProfileId,
  existingData,
  onNext,
  onBack,
}) => {
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    service_area: '',
    bio: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Populate form with existing data
  useEffect(() => {
    if (existingData) {
      setFormData({
        business_name: (existingData.business_name as string) || '',
        business_type: (existingData.business_type as string) || '',
        service_area: (existingData.service_area as string) || '',
        bio: (existingData.bio as string) || '',
      });
    }
  }, [existingData]);

  const businessTypeOptions = BUSINESS_TYPES.map(type => ({
    value: type,
    label: type,
  }));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const result = await saveStepAndProgress(
        profileId,
        2, // current step
        businessProfileId,
        formData,
        false // not skipping
      );

      if (!result.success) {
        setError(result.error || 'Failed to save business information');
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

    try {
      const result = await saveStepAndProgress(
        profileId,
        2, // current step
        businessProfileId,
        {},
        true // skipping
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

  const isFormValid = () => {
    return formData.business_name.trim().length > 0;
  };

  return (
    <div className="max-w-2xl mx-auto text-center sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Tell us about your <span className="text-orange-400">business</span>
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Help customers understand what you do and where you serve.
        </p>
      </div>

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-orange-500"
        showBlur={true}
        className="mb-8 text-left p-4"
      >
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <Input
            label="Business Name"
            placeholder="e.g., Stellar Digital Marketing"
            value={formData.business_name}
            onChange={value => handleInputChange('business_name', value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Select
              label="Business Type"
              placeholder="Select your business type"
              value={formData.business_type}
              onChange={value => handleInputChange('business_type', value)}
              options={businessTypeOptions}
            />

            <Input
              label="Service Area (Optional)"
              placeholder="e.g., Austin, TX, or Remote"
              value={formData.service_area}
              onChange={value => handleInputChange('service_area', value)}
            />
          </div>

          <TextArea
            label="Bio (Optional)"
            placeholder="Briefly describe your business, services, and what makes you unique. This will be the first thing customers read!"
            value={formData.bio}
            onChange={value => handleInputChange('bio', value)}
            rows={5}
            maxLength={280}
          />

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
                Skip for now
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:flex-1 px-6 sm:px-8"
                disabled={!isFormValid() || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </Button>{' '}
            </div>{' '}
          </div>
        </form>
      </GlassCard>

      <p className="text-xs text-gray-500">You can always edit this later.</p>
    </div>
  );
};
