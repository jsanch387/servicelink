'use client';

import { Button, Input, Select, TextArea } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import { saveStepAndProgress } from '../utils/onboardingHelpers';

interface Step2BusinessInfoProps {
  profileId: string;
  businessProfileId: string;
  existingData?: any;
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
  console.log('📋 Step2BusinessInfo loaded:', {
    profileId,
    businessProfileId,
    existingData,
  });

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
      console.log('📝 Populating form with existing data:', existingData);
      setFormData({
        business_name: existingData.business_name || '',
        business_type: existingData.business_type || '',
        service_area: existingData.service_area || '',
        bio: existingData.bio || '',
      });
    }
  }, [existingData]);

  const businessTypeOptions = BUSINESS_TYPES.map(type => ({
    value: type,
    label: type,
  }));

  const handleInputChange = (field: string, value: string) => {
    console.log(`📝 Form field changed: ${field} = "${value}"`);
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Saving Step 2 data:', formData);

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
        console.error('❌ Failed to save Step 2:', result.error);
        setError(result.error || 'Failed to save business information');
        setIsLoading(false);
        return;
      }

      console.log('✅ Step 2 saved successfully, moving to step 3');
      onNext();
    } catch (error) {
      console.error('❌ Error saving Step 2:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('⏭️ User skipping Step 2');
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
        console.error('❌ Failed to skip Step 2:', result.error);
        setError(result.error || 'Failed to skip step');
        setIsLoading(false);
        return;
      }

      console.log('✅ Skipped Step 2, moving to step 3');
      onNext();
    } catch (error) {
      console.error('❌ Error skipping Step 2:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.business_name.trim().length > 0;
  };

  return (
    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
          Tell us about your <span className="text-orange-400">business</span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-light max-w-3xl mx-auto">
          Help customers understand what you do and where you serve.
        </p>
      </div>

      {/* Main Content Container (Modular Block Style) */}
      <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl mx-2 sm:mx-0">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Business Name (Required) */}
          <Input
            label="Business Name"
            placeholder="e.g., Stellar Digital Marketing"
            value={formData.business_name}
            onChange={value => handleInputChange('business_name', value)}
            required
          />

          {/* Business Type & Service Area (Grid Layout) */}
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

          {/* Bio */}
          <TextArea
            label="Business Description (Optional)"
            placeholder="Briefly describe your business, services, and what makes you unique. This will be the first thing customers read!"
            value={formData.bio}
            onChange={value => handleInputChange('bio', value)}
            rows={5}
          />

          {/* Action Buttons - Mobile optimized */}
          <div className="flex flex-col gap-4 pt-6 sm:pt-8">
            {/* Back Button */}
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
              {/* Skip Button (Outline Style) */}
              <Button
                type="button"
                onClick={handleSkip}
                variant="outline"
                className="w-full sm:flex-1 px-6 sm:px-8"
                disabled={isLoading}
              >
                Skip for now
              </Button>

              {/* Continue Button (Primary Orange Style) */}
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:flex-1 px-6 sm:px-8"
                disabled={!isFormValid() || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <p className="text-sm sm:text-base text-gray-500 text-center mt-6 sm:mt-8 px-4 sm:px-0">
        This information forms the core of your profile. You can always edit it
        later.
      </p>
    </div>
  );
};
