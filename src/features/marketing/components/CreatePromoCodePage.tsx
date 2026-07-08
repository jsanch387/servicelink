'use client';

import { Button, Input, Select, Switch } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import type { PromoCodeFormData } from '../types';

const INITIAL_FORM_DATA: PromoCodeFormData = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  isActive: true,
  hasDateRange: false,
  startsAt: '',
  endsAt: '',
  hasMaxUses: false,
  maxUses: '',
  oneUsePerCustomer: true,
};

export const CreatePromoCodePage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<PromoCodeFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PromoCodeFormData, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PromoCodeFormData, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Code must be uppercase letters and numbers only';
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

    if (formData.hasDateRange) {
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
    }

    if (formData.hasMaxUses) {
      if (!formData.maxUses.trim()) {
        newErrors.maxUses = 'Max uses is required';
      } else {
        const value = parseInt(formData.maxUses);
        if (isNaN(value) || value <= 0) {
          newErrors.maxUses = 'Must be greater than 0';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      // TODO: API call to create promo code
      console.log('Create promo code:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate back to marketing page
      router.push(ROUTES.DASHBOARD.MARKETING);
    } catch (error) {
      console.error('Error creating promo code:', error);
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
              Create Promo Code
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
            {/* Code Name */}
            <Input
              label="Code"
              placeholder="SUMMER2026"
              value={formData.code}
              onChange={value =>
                setFormData({ ...formData, code: value.toUpperCase() })
              }
              required
              error={errors.code}
              disabled={isSaving}
              maxLength={20}
            />

            {/* Description */}
            <Input
              label="Description (optional)"
              placeholder="Internal note about this code"
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

            {/* Date Range Toggle */}
            <Switch
              checked={formData.hasDateRange}
              onCheckedChange={checked =>
                setFormData({ ...formData, hasDateRange: checked })
              }
              label="Set date range"
              description="Limit when this code can be used"
              disabled={isSaving}
            />

            {/* Date Range Fields */}
            {formData.hasDateRange && (
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
                    <p className="mt-1 text-sm text-red-400">
                      {errors.startsAt}
                    </p>
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
            )}

            {/* Max Uses Toggle */}
            <Switch
              checked={formData.hasMaxUses}
              onCheckedChange={checked =>
                setFormData({ ...formData, hasMaxUses: checked })
              }
              label="Limit total uses"
              description="Set maximum number of redemptions"
              disabled={isSaving}
            />

            {/* Max Uses Field */}
            {formData.hasMaxUses && (
              <Input
                label="Max Uses"
                placeholder="50"
                value={formData.maxUses}
                onChange={value => setFormData({ ...formData, maxUses: value })}
                type="text"
                inputMode="numeric"
                required
                error={errors.maxUses}
                disabled={isSaving}
              />
            )}

            {/* One Use Per Customer */}
            <Switch
              checked={formData.oneUsePerCustomer}
              onCheckedChange={checked =>
                setFormData({ ...formData, oneUsePerCustomer: checked })
              }
              label="One use per customer"
              description="Prevent customers from using this code multiple times"
              disabled={isSaving}
            />

            {/* Active Status */}
            <Switch
              checked={formData.isActive}
              onCheckedChange={checked =>
                setFormData({ ...formData, isActive: checked })
              }
              label="Active"
              description="Code is active and can be used immediately"
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
