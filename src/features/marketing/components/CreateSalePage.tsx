'use client';

import { Button, Input, Select, Switch } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import type { SaleFormData } from '../types';

const INITIAL_FORM_DATA: SaleFormData = {
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
  appliesToAllServices: true,
  serviceIds: [],
};

export const CreateSalePage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<SaleFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SaleFormData, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SaleFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Sale name is required';
    }

    if (!formData.discountValue.trim()) {
      newErrors.discountValue = 'Discount value is required';
    } else {
      const value = parseFloat(formData.discountValue);
      if (isNaN(value) || value <= 0) {
        newErrors.discountValue = 'Must be greater than 0';
      } else if (formData.discountType === 'percentage' && value > 100) {
        newErrors.discountValue = 'Percentage cannot exceed 100%';
      }
    }

    if (!formData.startsAt) {
      newErrors.startsAt = 'Start date is required';
    }

    if (!formData.endsAt) {
      newErrors.endsAt = 'End date is required';
    }

    if (
      formData.startsAt &&
      formData.endsAt &&
      new Date(formData.startsAt) >= new Date(formData.endsAt)
    ) {
      newErrors.endsAt = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      // TODO: API call to create sale
      console.log('Create sale:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate back to marketing page
      router.push(ROUTES.DASHBOARD.MARKETING);
    } catch (error) {
      console.error('Error creating sale:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[var(--dashboard-bg)]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white sm:text-xl">
              Create Sale
            </h1>
          </div>
          <Button
            onClick={handleSave}
            variant="primary"
            size="sm"
            disabled={isSaving}
            loading={isSaving}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-6">
            {/* Sale Name */}
            <Input
              label="Sale Name"
              placeholder="4th of July Sale"
              value={formData.name}
              onChange={value => setFormData({ ...formData, name: value })}
              required
              error={errors.name}
              disabled={isSaving}
            />

            {/* Description */}
            <Input
              label="Description (optional)"
              placeholder="Internal note about this sale"
              value={formData.description}
              onChange={value =>
                setFormData({ ...formData, description: value })
              }
              disabled={isSaving}
            />

            {/* Discount Type and Value */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Discount Type"
                value={formData.discountType}
                onChange={value =>
                  setFormData({
                    ...formData,
                    discountType: value as 'percentage' | 'fixed_amount',
                  })
                }
                options={[
                  { value: 'percentage', label: 'Percentage Off (%)' },
                  { value: 'fixed_amount', label: 'Dollar Amount Off ($)' },
                ]}
                required
                disabled={isSaving}
              />
              <Input
                label="Discount Value"
                placeholder={
                  formData.discountType === 'percentage' ? '20' : '15'
                }
                value={formData.discountValue}
                onChange={value =>
                  setFormData({ ...formData, discountValue: value })
                }
                type="text"
                inputMode="decimal"
                required
                error={errors.discountValue}
                disabled={isSaving}
              />
            </div>

            {/* Date Range Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                  Start Date <span className="ml-1 text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startsAt}
                  onChange={e =>
                    setFormData({ ...formData, startsAt: e.target.value })
                  }
                  disabled={isSaving}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white transition-all duration-200 focus:border-white/30 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {errors.startsAt && (
                  <p className="mt-1 text-sm text-red-400">{errors.startsAt}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                  End Date <span className="ml-1 text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endsAt}
                  onChange={e =>
                    setFormData({ ...formData, endsAt: e.target.value })
                  }
                  disabled={isSaving}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white transition-all duration-200 focus:border-white/30 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {errors.endsAt && (
                  <p className="mt-1 text-sm text-red-400">{errors.endsAt}</p>
                )}
              </div>
            </div>

            {/* Applies to All Services */}
            <Switch
              checked={formData.appliesToAllServices}
              onCheckedChange={checked =>
                setFormData({ ...formData, appliesToAllServices: checked })
              }
              label="Apply to all services"
              description="When enabled, this sale applies to all your services"
              disabled={isSaving}
            />

            {/* Service-specific note (V1: just show info, V2: add service selector) */}
            {!formData.appliesToAllServices && (
              <div className="rounded-lg border border-blue-400/35 bg-blue-500/12 p-4">
                <p className="text-sm text-blue-300">
                  Service-specific sales are coming soon. For now, sales apply
                  to all services.
                </p>
              </div>
            )}

            {/* Active Status */}
            <Switch
              checked={formData.isActive}
              onCheckedChange={checked =>
                setFormData({ ...formData, isActive: checked })
              }
              label="Active"
              description="Sale is active and will apply during the specified dates"
              disabled={isSaving}
            />
          </div>

          {/* Bottom padding for mobile */}
          <div className="h-20 sm:h-8" />
        </div>
      </div>
    </div>
  );
};
