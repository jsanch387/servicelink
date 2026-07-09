'use client';

import { Button, GlassCard, Input, Select, Switch } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useState } from 'react';
import { PromoCodeCreatedSuccess } from './PromoCodeCreatedSuccess';
import { useMarketingStore } from '../stores/marketingStore';
import type { PromoCode, PromoCodeFormData } from '../types';
import { formatPromoDiscount } from '../utils/formatPromoDiscount';
import { promoCodeFromFormData } from '../utils/promoCodeFromFormData';

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
  const addPromoCode = useMarketingStore(state => state.addPromoCode);
  const [formData, setFormData] =
    useState<PromoCodeFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PromoCodeFormData, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [createdPromoCode, setCreatedPromoCode] = useState<PromoCode | null>(
    null
  );

  const showPreview =
    formData.code.trim().length > 0 &&
    formData.discountValue.trim().length > 0 &&
    !errors.discountValue;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PromoCodeFormData, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Use uppercase letters and numbers only';
    }

    if (!formData.discountValue.trim()) {
      newErrors.discountValue = 'Discount is required';
    } else {
      const value = parseFloat(formData.discountValue);
      if (isNaN(value) || value <= 0) {
        newErrors.discountValue = 'Must be greater than 0';
      } else if (formData.discountType === 'percentage' && value > 100) {
        newErrors.discountValue = 'Cannot exceed 100%';
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
      const promoCode = promoCodeFromFormData(formData);
      addPromoCode(promoCode);
      setCreatedPromoCode(promoCode);
    } catch (error) {
      console.error('Error creating promo code:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAnother = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowMoreOptions(false);
    setCreatedPromoCode(null);
  };

  if (createdPromoCode) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
        <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]">
          <div className="flex w-full items-center px-4 pt-6 pb-3 sm:px-6 sm:pt-8 lg:px-8">
            <Link
              href={ROUTES.DASHBOARD.MARKETING}
              className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-white cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeftIcon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={2}
              />
              <span>Go back</span>
            </Link>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PromoCodeCreatedSuccess
            promoCode={createdPromoCode}
            onCreateAnother={handleCreateAnother}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]">
        <div className="flex w-full items-center justify-between px-4 pt-6 pb-3 sm:px-6 sm:pt-8 lg:px-8">
          <Link
            href={ROUTES.DASHBOARD.MARKETING}
            className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-white cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeftIcon
              className="h-[18px] w-[18px] shrink-0"
              strokeWidth={2}
            />
            <span>Go back</span>
          </Link>
          <Button
            onClick={handleSave}
            variant="primary"
            size="xs"
            className="min-h-8 rounded-[10px] px-3 text-sm font-medium"
            disabled={isSaving}
            loading={isSaving}
          >
            Create code
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-2 sm:max-w-2xl sm:px-6 sm:pb-12 sm:pt-4 lg:max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              New promo code
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Name your code, set the discount, and share it with customers.
              They enter it at checkout — that&apos;s it.
            </p>
          </div>

          {showPreview ? (
            <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-5 py-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Customers will enter
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-wide text-white">
                {formData.code}
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-400">
                {formatPromoDiscount(
                  formData.discountType,
                  formData.discountValue
                )}
              </p>
            </div>
          ) : null}

          <GlassCard padding="lg" rounded="rounded-2xl" className="mb-4">
            <div className="space-y-5">
              <Input
                label="Promo code"
                placeholder="NEWUSER"
                value={formData.code}
                onChange={value =>
                  setFormData({ ...formData, code: value.toUpperCase() })
                }
                required
                error={errors.code}
                disabled={isSaving}
                maxLength={20}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Discount type"
                  value={formData.discountType}
                  onChange={value =>
                    setFormData({
                      ...formData,
                      discountType: value as 'percentage' | 'fixed_amount',
                    })
                  }
                  options={[
                    { value: 'percentage', label: 'Percentage (%)' },
                    { value: 'fixed_amount', label: 'Fixed amount ($)' },
                  ]}
                  required
                  disabled={isSaving}
                />
                <Input
                  label="Amount"
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

              <div className="border-t border-white/[0.06] pt-1">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  label="Active"
                  description={
                    formData.isActive
                      ? 'Ready to use — customers can apply this code now'
                      : 'Off for now — turn on when you want it live'
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </GlassCard>

          <button
            type="button"
            onClick={() => setShowMoreOptions(open => !open)}
            className="mb-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            aria-expanded={showMoreOptions}
          >
            <span>More options</span>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-500 transition-transform ${
                showMoreOptions ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showMoreOptions ? (
            <GlassCard padding="lg" rounded="rounded-2xl" className="mb-6">
              <div className="space-y-5">
                <Input
                  label="Note (optional)"
                  placeholder="e.g. New customer welcome offer"
                  value={formData.description}
                  onChange={value =>
                    setFormData({ ...formData, description: value })
                  }
                  disabled={isSaving}
                />

                <Switch
                  checked={formData.hasDateRange}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, hasDateRange: checked })
                  }
                  label="Set date range"
                  description="Limit when this code can be used"
                  disabled={isSaving}
                />

                {formData.hasDateRange ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                        Start date <span className="ml-1 text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.startsAt}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            startsAt: e.target.value,
                          })
                        }
                        disabled={isSaving}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white transition-all duration-200 focus:border-white/30 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                      {errors.startsAt ? (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.startsAt}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                        End date <span className="ml-1 text-red-400">*</span>
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
                      {errors.endsAt ? (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.endsAt}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <Switch
                  checked={formData.hasMaxUses}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, hasMaxUses: checked })
                  }
                  label="Limit total uses"
                  description="Cap how many times this code can be redeemed"
                  disabled={isSaving}
                />

                {formData.hasMaxUses ? (
                  <Input
                    label="Max uses"
                    placeholder="50"
                    value={formData.maxUses}
                    onChange={value =>
                      setFormData({ ...formData, maxUses: value })
                    }
                    type="text"
                    inputMode="numeric"
                    required
                    error={errors.maxUses}
                    disabled={isSaving}
                  />
                ) : null}

                <Switch
                  checked={formData.oneUsePerCustomer}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, oneUsePerCustomer: checked })
                  }
                  label="One use per customer"
                  description="Each customer can only use this code once"
                  disabled={isSaving}
                />
              </div>
            </GlassCard>
          ) : null}

          <div className="hidden sm:block">
            <Button
              onClick={handleSave}
              variant="primary"
              size="md"
              fullWidth
              disabled={isSaving}
              loading={isSaving}
            >
              Create code
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm sm:hidden">
        <Button
          onClick={handleSave}
          variant="primary"
          size="md"
          fullWidth
          disabled={isSaving}
          loading={isSaving}
        >
          Create code
        </Button>
      </div>
    </div>
  );
};
