'use client';

import React, { useState, useEffect } from 'react';
import {
  Input,
  TextArea,
  Button,
  PriceInput,
  Select,
} from '@/components/shared';
import { PlusIcon } from '@heroicons/react/24/outline';
import {
  BusinessServicesService,
  Service,
} from '../services/businessServicesService';
import { saveStepAndProgress } from '../utils/onboardingHelpers';
import { ServiceCard } from '@/features/business-profile';

interface Step3ServicesProps {
  profileId: string;
  businessProfileId: string;
  existingData?: any;
  onNext: () => void;
  onBack: () => void;
}

const HOURS_OPTIONS = [
  { value: '', label: 'Select hours' },
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
  { value: '4', label: '4 hours' },
  { value: '5', label: '5 hours' },
  { value: '6', label: '6 hours' },
  { value: '7', label: '7 hours' },
  { value: '8', label: '8 hours' },
  { value: '9', label: '9 hours' },
  { value: '10', label: '10+ hours' },
];

export const Step3Services: React.FC<Step3ServicesProps> = ({
  profileId,
  businessProfileId,
  existingData,
  onNext,
  onBack,
}) => {
  console.log('🛠️ Step3Services loaded:', {
    profileId,
    businessProfileId,
    existingData,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [currentService, setCurrentService] = useState<Service>({
    name: '',
    description: '',
    price: '',
    hours_to_complete: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load existing services from database
  useEffect(() => {
    const loadExistingServices = async () => {
      console.log('📝 Loading existing services from database...');

      const result =
        await BusinessServicesService.getServicesByBusinessId(
          businessProfileId
        );

      if (result.success && result.data) {
        console.log('✅ Loaded existing services:', result.data);
        setServices(result.data);
      } else {
        console.log('ℹ️ No existing services found');
      }
    };

    loadExistingServices();
  }, [businessProfileId]);

  const handleServiceChange = (
    field: keyof Service,
    value: string | number
  ) => {
    console.log(`📝 Service ${field} changed:`, value);
    setCurrentService(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addService = () => {
    if (!currentService.name.trim()) {
      setError('Please enter a service name');
      return;
    }

    console.log('➕ Adding service:', currentService);
    const newService: Service = {
      ...currentService,
      id: `temp-${Date.now()}`, // Temporary ID for UI
    };

    setServices(prev => [...prev, newService]);
    setCurrentService({
      name: '',
      description: '',
      price: '',
      hours_to_complete: undefined,
    });
    setError('');
  };

  const removeService = (index: number) => {
    console.log('🗑️ Removing service at index:', index);
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Saving Step 3 services data:', services);

    setIsLoading(true);
    setError('');

    try {
      // Save services to business_services table
      const servicesResult =
        await BusinessServicesService.createServicesForOnboarding(
          businessProfileId,
          services
        );

      if (!servicesResult.success) {
        console.error('❌ Failed to save services:', servicesResult.error);
        setError(servicesResult.error || 'Failed to save services');
        setIsLoading(false);
        return;
      }

      // Update onboarding progress
      const progressResult = await saveStepAndProgress(
        profileId,
        3, // current step
        businessProfileId,
        {}, // No business profile data to update
        false // not skipping
      );

      if (!progressResult.success) {
        console.error('❌ Failed to update progress:', progressResult.error);
        setError(progressResult.error || 'Failed to update progress');
        setIsLoading(false);
        return;
      }

      console.log('✅ Step 3 saved successfully, moving to step 4');
      onNext();
    } catch (error) {
      console.error('❌ Error saving Step 3:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('⏭️ User skipping Step 3');
    setIsLoading(true);

    try {
      const result = await saveStepAndProgress(
        profileId,
        3, // current step
        businessProfileId,
        {},
        true // skipping
      );

      if (!result.success) {
        console.error('❌ Failed to skip Step 3:', result.error);
        setError(result.error || 'Failed to skip step');
        setIsLoading(false);
        return;
      }

      console.log('✅ Skipped Step 3, moving to step 4');
      onNext();
    } catch (error) {
      console.error('❌ Error skipping Step 3:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          What services do you offer?
        </h1>
        <p className="text-xl text-gray-300">
          Add your services to help customers understand what you do.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Service Form */}
        <div className="space-y-6">
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Add a Service
            </h2>

            <div className="space-y-4">
              <Input
                label="Service Name"
                placeholder="e.g., Website Design, House Cleaning"
                value={currentService.name}
                onChange={value => handleServiceChange('name', value)}
              />

              <TextArea
                label="Description"
                placeholder="Briefly describe this service..."
                value={currentService.description}
                onChange={value => handleServiceChange('description', value)}
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PriceInput
                  label="Price"
                  placeholder="Enter price"
                  value={currentService.price}
                  onChange={value => handleServiceChange('price', value)}
                />

                <Select
                  label="Hours to Complete"
                  placeholder="Select hours"
                  value={currentService.hours_to_complete?.toString() || ''}
                  onChange={value => {
                    const numValue = value ? parseInt(value) : undefined;
                    handleServiceChange('hours_to_complete', numValue || 0);
                  }}
                  options={HOURS_OPTIONS}
                />
              </div>

              <Button
                onClick={addService}
                variant="primary"
                className="w-full"
                disabled={!currentService.name.trim()}
                icon={<PlusIcon className="h-5 w-5" />}
              >
                Add Service
              </Button>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Your Services ({services.length})
          </h2>

          {services.length === 0 ? (
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No services added yet</p>
              <p className="text-sm text-gray-500">
                Add your first service using the form on the left
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {services.map((service, index) => (
                <div key={index} className="relative">
                  <ServiceCard
                    service={service}
                    isEditable={true}
                    onDelete={() => removeService(index)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
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
            onClick={() => handleSubmit({} as React.FormEvent)}
            variant="primary"
            className="flex-1"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-400 text-center mt-6">
        You can always add more services later from your dashboard
      </p>
    </div>
  );
};
