'use client';

import { Button, Input, PhoneInput, Select } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import { BookingRequestFormData } from '../types/bookingRequest';
import { DateInput } from './DateInput';

interface BookingRequestFormProps {
  businessName: string;
  serviceName?: string;
  servicePrice?: number;

  onSubmit: (_data: BookingRequestFormData) => void;
  isLoading?: boolean;
}

export const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  businessName,
  serviceName = '',
  servicePrice,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<BookingRequestFormData>({
    name: '',
    phone: '',
    preferredDate: '',
    preferredTimeWindow: '',
    service: serviceName || 'General Inquiry',
    message: '',
  });

  // Update service when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      service: serviceName || 'General Inquiry',
    }));
  }, [serviceName]);

  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingRequestFormData, string>>
  >({});

  // Update service when prop changes
  useEffect(() => {
    if (serviceName) {
      setFormData(prev => ({ ...prev, service: serviceName }));
    }
  }, [serviceName]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BookingRequestFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.preferredDate.trim()) {
      newErrors.preferredDate = 'Preferred date is required';
    }

    if (!formData.preferredTimeWindow.trim()) {
      newErrors.preferredTimeWindow = 'Preferred time window is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof BookingRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPrice = (price: number | undefined): string => {
    if (!price || price === 0) return 'Contact for quote';
    return `$${(price / 100).toFixed(0)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="w-full text-left">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-left">
        <p className="text-[10px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 text-left">
          Request a booking with
        </p>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 text-left">
          {businessName}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed text-left">
          Fill out the form below and we&apos;ll get back to you soon.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-3 sm:space-y-4">
        {/* Selected Service - Always show */}
        <div className="space-y-1.5">
          <label className="block text-left text-[11px] font-bold text-gray-500 tracking-wide ml-1">
            Selected Service
          </label>
          <div className="bg-[#1c1c1e] border border-orange-500/50 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {formData.service}
                </h3>
                {servicePrice !== undefined && servicePrice > 0 && (
                  <p className="text-sm text-gray-400">
                    Starting at {formatPrice(servicePrice)}
                  </p>
                )}
              </div>
              {servicePrice !== undefined && servicePrice > 0 && (
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    {formatPrice(servicePrice)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-left text-[11px] sm:text-[11px] font-bold text-gray-500 tracking-wide ml-1">
            Full Name<span className="text-red-400 ml-1">*</span>
          </label>
          <Input
            placeholder="John Doe"
            value={formData.name}
            onChange={value => handleChange('name', value)}
            required
            error={errors.name}
            autoComplete="name"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="block text-left text-[11px] font-bold text-gray-500 tracking-wide ml-1">
            Phone Number<span className="text-red-400 ml-1">*</span>
          </label>
          <PhoneInput
            label=""
            value={formData.phone}
            onChange={value => handleChange('phone', value)}
            placeholder="(555) 000-0000"
            required
            error={errors.phone}
            className="[&>label]:hidden [&_input]:!bg-white/5 [&_input]:!border-white/10 [&_input]:!rounded-lg [&_input]:!text-white [&_input]:!placeholder-gray-500 [&_input]:!text-base [&_input]:sm:!text-sm [&_input]:!font-medium [&_input]:!py-3.5 [&_input]:sm:!py-4 [&_input]:!px-4 [&_input]:sm:!px-5 [&_input]:!focus:ring-white/20 [&_input]:!focus:border-white/30 [&_input]:!focus:bg-white/8 [&_input]:!hover:border-white/20 [&_input]:!active:bg-white/8 [&_input]:!focus:outline-none [&_input]:!focus:ring-2 w-full"
          />
        </div>

        {/* Preferred Date and Time Window Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label className="block text-left text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              Preferred Date<span className="text-red-400 ml-1">*</span>
            </label>
            <DateInput
              value={formData.preferredDate}
              onChange={value => handleChange('preferredDate', value)}
              placeholder="MM/DD/YYYY"
              required
              error={errors.preferredDate}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-left text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              Preferred Time Window<span className="text-red-400 ml-1">*</span>
            </label>
            <Select
              value={formData.preferredTimeWindow}
              onChange={value => handleChange('preferredTimeWindow', value)}
              options={[
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
                { value: 'evening', label: 'Evening' },
              ]}
              placeholder="Select time"
              required
              error={errors.preferredTimeWindow}
            />
          </div>
        </div>

        {/* Message - Optional */}
        {/* Commented out - can be re-enabled later if needed */}
        {/* <div className="space-y-1.5">
          <label className="block text-left text-[11px] font-bold text-gray-500 tracking-wide ml-1">
            Message
          </label>
          <TextArea
            placeholder="Additional details or special requests..."
            value={formData.message || ''}
            onChange={value => handleChange('message', value)}
            rows={3}
            maxLength={500}
          />
        </div> */}
      </div>

      {/* Submit Button */}
      <div className="mt-5 sm:mt-6">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          className="py-3.5 sm:py-4 font-black text-sm sm:text-base shadow-xl hover:scale-[1.01] transition-all touch-manipulation"
        >
          SEND REQUEST
        </Button>
        <p className="text-[10px] sm:text-[10px] text-center text-gray-500 font-medium pt-2 sm:pt-3 px-2">
          By submitting, you agree to be contacted via the provided info.
        </p>
      </div>
    </form>
  );
};
