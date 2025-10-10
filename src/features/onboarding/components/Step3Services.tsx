'use client';

import {
  Button,
  Input,
  PriceInput,
  Select,
  TextArea,
} from '@/components/shared';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import {
  BusinessServicesService,
  Service,
} from '../services/businessServicesService';
import { saveStepAndProgress } from '../utils/onboardingHelpers';

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

// Simple Service Card Component for the onboarding flow
const ServiceCard = ({
  service,
  onDelete,
}: {
  service: Service;
  onDelete: () => void;
}) => (
  <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-5 bg-neutral-900 rounded-xl transition duration-300 hover:bg-neutral-700/50 group border border-neutral-800 hover:border-orange-400/50">
    {/* Service icon */}
    <div className="p-1.5 sm:p-2 rounded-full bg-orange-900/40 border border-orange-500/20 flex-shrink-0">
      <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold block text-sm sm:text-base leading-tight">
            {service.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 block leading-relaxed mt-1">
            {service.description || 'No description provided'}
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs font-medium">
            {service.price && (
              <span className="text-orange-400">
                Price: <span className="text-white">${service.price}</span>
              </span>
            )}
            {service.hours_to_complete && (
              <span className="text-gray-500">
                Time:{' '}
                <span className="text-white">
                  {service.hours_to_complete}{' '}
                  {service.hours_to_complete === 1 ? 'hour' : 'hours'}
                </span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-500 hover:text-red-400 transition duration-150 p-1 rounded-full hover:bg-red-900/20 flex-shrink-0 ml-2"
          title="Remove service"
        >
          <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  </div>
);

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
  const [existingServices, setExistingServices] = useState<Service[]>([]); // Track existing services from DB
  const [removedServices, setRemovedServices] = useState<Service[]>([]); // Track services to delete from DB
  const [currentService, setCurrentService] = useState<Service>({
    name: '',
    description: '',
    price: '',
    hours_to_complete: undefined,
  });

  // Character limits
  const MAX_DESCRIPTION_LENGTH = 280;
  const MAX_PRICE_LENGTH = 8; // Max 8 digits for price (e.g., 999999.99)

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [servicesLoaded, setServicesLoaded] = useState(false);

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
        setExistingServices(result.data); // Track existing services separately
        setServices(result.data); // Set services for display
      } else {
        console.log('ℹ️ No existing services found');
        setExistingServices([]); // Initialize as empty array
      }
      setServicesLoaded(true);
    };

    loadExistingServices();
  }, [businessProfileId]);

  const handleServiceChange = (
    field: keyof Service,
    value: string | number | undefined
  ) => {
    console.log(`📝 Service ${field} changed:`, value);

    // Apply character limits
    if (field === 'description' && typeof value === 'string') {
      if (value.length > MAX_DESCRIPTION_LENGTH) {
        return; // Don't update if exceeding limit
      }
    }

    if (field === 'price' && typeof value === 'string') {
      // Remove non-numeric characters except decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Limit to MAX_PRICE_LENGTH characters
      if (numericValue.length > MAX_PRICE_LENGTH) {
        return; // Don't update if exceeding limit
      }
      value = numericValue;
    }

    setCurrentService(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addService = () => {
    if (!currentService.name.trim()) {
      setError('Please enter a service name.');
      return;
    }

    if (!currentService.price.trim()) {
      setError('Please enter a price for this service.');
      return;
    }

    if (!currentService.description.trim()) {
      setError("Please describe what's included in this service.");
      return;
    }

    console.log('➕ Adding service:', currentService);
    const newService: Service = {
      ...currentService,
      id: `temp-${Date.now()}`,
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

    const serviceToRemove = services[index];

    // If it's an existing service (not a temp/new service), track it for deletion
    if (
      serviceToRemove.id &&
      !serviceToRemove.id.toString().startsWith('temp-')
    ) {
      console.log(
        '📝 Tracking existing service for deletion:',
        serviceToRemove
      );
      setRemovedServices(prev => [...prev, serviceToRemove]);
    }

    setServices(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to identify new services (not already in database)
  const getNewServices = () => {
    return services.filter(service => {
      // Services with temporary IDs (starting with 'temp-') are always new
      if (service.id && service.id.toString().startsWith('temp-')) {
        return true;
      }

      // Check if service exists in existingServices by ID
      return !existingServices.some(existing => existing.id === service.id);
    });
  };

  const handleSubmit = async () => {
    console.log('💾 Saving Step 3 services data:', services);

    setIsLoading(true);
    setError('');

    try {
      // Step 0: Handle service deletions
      // If user has 0 services but had existing services, delete ALL existing services
      if (services.length === 0 && existingServices.length > 0) {
        console.log(
          '🗑️ STEP 0: User has no services - deleting all existing services:',
          existingServices.length
        );
        console.log('📋 Existing services to delete:', existingServices);

        const serviceIds = existingServices
          .map(service => service.id)
          .filter(Boolean) as string[];

        console.log('🔑 Service IDs to delete:', serviceIds);

        const deletePromises = serviceIds.map(serviceId => {
          console.log('🗑️ Hard deleting service ID:', serviceId);
          return BusinessServicesService.hardDeleteService(serviceId);
        });
        const deleteResults = await Promise.all(deletePromises);

        console.log('📊 Delete results:', deleteResults);

        const failedDeletes = deleteResults.filter(result => !result.success);
        if (failedDeletes.length > 0) {
          console.error('❌ Failed to delete all services:', failedDeletes);
          setError('Failed to delete services. Please try again.');
          setIsLoading(false);
          return;
        }

        console.log('✅ STEP 0 COMPLETE: All services deleted successfully');
        setExistingServices([]);
        setRemovedServices([]);
      } else if (removedServices.length > 0) {
        // Otherwise, just delete the services that were explicitly removed
        console.log(
          '🗑️ STEP 0: Deleting removed services:',
          removedServices.length
        );

        const serviceIds = removedServices
          .map(service => service.id)
          .filter(Boolean) as string[];

        const deletePromises = serviceIds.map(serviceId =>
          BusinessServicesService.hardDeleteService(serviceId)
        );
        const deleteResults = await Promise.all(deletePromises);

        const failedDeletes = deleteResults.filter(result => !result.success);
        if (failedDeletes.length > 0) {
          console.error('❌ Failed to delete some services:', failedDeletes);
          setError('Failed to delete some services. Please try again.');
          setIsLoading(false);
          return;
        }

        console.log(
          '✅ STEP 0 COMPLETE: Removed services deleted successfully'
        );

        // Clear the removed services array since they've been successfully deleted
        setRemovedServices([]);
      }

      // Step 1: Save new services (not already in database)
      const newServices = getNewServices();

      console.log('📝 Existing services:', existingServices.length);
      console.log('🆕 New services to save:', newServices.length);

      // If no new services to save, just update progress
      if (newServices.length === 0) {
        console.log('ℹ️ No new services to save, updating progress only');
      } else {
        console.log('💾 Saving new services:', newServices);
        const servicesResult =
          await BusinessServicesService.createServicesForOnboarding(
            businessProfileId,
            newServices
          );

        if (!servicesResult.success) {
          console.error('❌ Failed to save services:', servicesResult.error);
          setError(servicesResult.error || 'Failed to save services');
          setIsLoading(false);
          return;
        }
      }

      const progressResult = await saveStepAndProgress(
        profileId,
        3,
        businessProfileId,
        {},
        false
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
        3,
        businessProfileId,
        {},
        true
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

  // Allow continuing even with 0 services (user can add services later)
  const canContinue = true;

  return (
    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
          List Your <span className="text-orange-400">Services</span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-light max-w-3xl mx-auto">
          Tell customers what you do and how much it costs. Keep it simple and
          clear.
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Add Service Form */}
        <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl sm:mx-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            Add a Service
          </h2>

          <form className="space-y-4 sm:space-y-6">
            <Input
              label="Service Name"
              placeholder="House Cleaning, Logo Design, Car Repair"
              value={currentService.name}
              onChange={value => handleServiceChange('name', value)}
              required
            />

            <div className="space-y-2">
              <TextArea
                label="What's included? (Required)"
                placeholder="Tell customers what they get. Keep it simple."
                value={currentService.description}
                onChange={value => handleServiceChange('description', value)}
                rows={3}
                required
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Describe what customers get with this service
                </span>
                <span
                  className={`${
                    currentService.description.length >
                    MAX_DESCRIPTION_LENGTH * 0.9
                      ? 'text-orange-400'
                      : 'text-gray-500'
                  }`}
                >
                  {currentService.description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <PriceInput
                  label="How much does it cost? (Required)"
                  placeholder="0.00"
                  value={currentService.price}
                  onChange={value => handleServiceChange('price', value)}
                  required
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Enter price in dollars (e.g., 150.00)
                  </span>
                  <span
                    className={`${
                      currentService.price.length > MAX_PRICE_LENGTH * 0.8
                        ? 'text-orange-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {currentService.price.length}/{MAX_PRICE_LENGTH}
                  </span>
                </div>
              </div>

              <Select
                label="How long does it take? (Optional)"
                placeholder="Select hours"
                value={currentService.hours_to_complete?.toString() || ''}
                onChange={value => {
                  const numValue = value ? parseInt(value) : undefined;
                  handleServiceChange('hours_to_complete', numValue);
                }}
                options={HOURS_OPTIONS}
              />
            </div>

            <Button
              type="button"
              onClick={addService}
              variant="primary"
              className="w-full mt-4 sm:mt-6 text-base sm:text-lg"
              disabled={!currentService.name.trim()}
            >
              Add This Service
            </Button>
          </form>
        </div>

        {/* Services List */}
        <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl mx-2 sm:mx-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            Your Services ({services.length})
          </h2>

          {servicesLoaded && services.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 sm:p-8 text-center border-dashed">
              <PlusIcon className="h-8 w-8 sm:h-10 sm:w-10 text-orange-400 mx-auto mb-3 sm:mb-4 opacity-60" />
              <p className="text-gray-400 mb-2 font-semibold text-sm sm:text-base">
                No services yet
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Add your first service using the form on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-2">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id || index}
                  service={service}
                  onDelete={() => removeService(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 pt-6 sm:pt-8 mt-8 sm:mt-10 px-4 sm:px-0">
        {/* Back Button */}
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="w-full sm:w-auto px-6 sm:px-8 order-2 sm:order-1"
          disabled={isLoading}
        >
          ← Back
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
          {/* Skip Button */}
          <Button
            type="button"
            onClick={handleSkip}
            variant="outline"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={isLoading}
          >
            Skip for now
          </Button>

          {/* Continue Button */}
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={!canContinue || isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>

      <p className="text-sm sm:text-base text-gray-500 text-center mt-6 sm:mt-8 px-4 sm:px-0">
        Don&apos;t worry - you can always add, change, or remove services later.
      </p>
    </div>
  );
};
