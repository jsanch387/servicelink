'use client';

import React, { useState, useEffect } from 'react';
import { Input, TextArea, Select, Button } from '@/components/shared';
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Tell us about your business
        </h1>
        <p className="text-xl text-gray-300">
          Help customers understand what you do and where you serve.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <Input
          label="Business Name"
          placeholder="Enter your business name"
          value={formData.business_name}
          onChange={value => handleInputChange('business_name', value)}
          required
        />

        {/* Business Type */}
        <Select
          label="Business Type"
          placeholder="Select your business type"
          value={formData.business_type}
          onChange={value => handleInputChange('business_type', value)}
          options={businessTypeOptions}
        />

        {/* Service Area */}
        <Input
          label="Service Area"
          placeholder="e.g., Downtown Miami, Miami-Dade County"
          value={formData.service_area}
          onChange={value => handleInputChange('service_area', value)}
        />

        {/* Bio */}
        <TextArea
          label="Business Description"
          placeholder="Briefly describe your business, services, and what makes you unique..."
          value={formData.bio}
          onChange={value => handleInputChange('bio', value)}
          rows={4}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            type="button"
            onClick={onBack}
            variant="secondary"
            className="sm:w-auto"
            disabled={isLoading}
          >
            Back
          </Button>

          <div className="flex gap-4 flex-1">
            <Button
              type="button"
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Skip for now
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={!isFormValid() || isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </div>
      </form>

      <p className="text-sm text-gray-400 text-center mt-6">
        You can always edit this information later
      </p>
    </div>
  );
};
