'use client';

import { Button, GlassCard, Input, Select, Switch } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useState } from 'react';
import { SaleCreatedSuccess } from './SaleCreatedSuccess';
import { useMarketingStore } from '../stores/marketingStore';
import type { Sale, SaleFormData } from '../types';
import { formatPromoDiscount } from '../utils/formatPromoDiscount';
import { formatSaleDateRange } from '../utils/formatSaleDateRange';
import { saleFromFormData } from '../utils/saleFromFormData';

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

const dateInputClassName =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white transition-all duration-200 focus:border-white/30 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/20';

export const CreateSalePage: React.FC = () => {
  const addSale = useMarketingStore(state => state.addSale);
  const [formData, setFormData] = useState<SaleFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SaleFormData, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);

  const showPreview =
    formData.name.trim().length > 0 &&
    formData.discountValue.trim().length > 0 &&
    !errors.discountValue;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SaleFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Sale name is required';
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
      const sale = saleFromFormData(formData);
      addSale(sale);
      setCreatedSale(sale);
    } catch (error) {
      console.error('Error creating sale:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAnother = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowMoreOptions(false);
    setCreatedSale(null);
  };

  if (createdSale) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
        <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]">
          <div className="flex w-full items-center px-4 pt-6 pb-3 sm:px-6 sm:pt-8 lg:px-8">
            <Link
              href={ROUTES.DASHBOARD.MARKETING}
              className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
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
          <SaleCreatedSuccess
            sale={createdSale}
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
            className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
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
            Create sale
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-2 sm:max-w-2xl sm:px-6 sm:pb-12 sm:pt-4 lg:max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              New sale
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Run a limited-time discount that applies automatically when
              customers book. Set the dates, turn it on, and you&apos;re done.
            </p>
          </div>

          {showPreview ? (
            <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-5 py-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Customers booking during your sale get
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-white">
                {formData.name}
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-400">
                {formatPromoDiscount(
                  formData.discountType,
                  formData.discountValue
                )}
              </p>
              {formData.startsAt && formData.endsAt ? (
                <p className="mt-2 text-xs text-gray-400">
                  {formatSaleDateRange(formData.startsAt, formData.endsAt)}
                </p>
              ) : null}
            </div>
          ) : null}

          <GlassCard padding="lg" rounded="rounded-2xl" className="mb-4">
            <div className="space-y-5">
              <Input
                label="Sale name"
                placeholder="4th of July Sale"
                value={formData.name}
                onChange={value => setFormData({ ...formData, name: value })}
                required
                error={errors.name}
                disabled={isSaving}
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                    Start date <span className="ml-1 text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={e =>
                      setFormData({ ...formData, startsAt: e.target.value })
                    }
                    disabled={isSaving}
                    className={dateInputClassName}
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
                    className={dateInputClassName}
                  />
                  {errors.endsAt ? (
                    <p className="mt-1 text-sm text-red-400">{errors.endsAt}</p>
                  ) : null}
                </div>
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
                      ? 'Ready to go — discounts apply automatically during these dates'
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
                  placeholder="e.g. Summer booking promotion"
                  value={formData.description}
                  onChange={value =>
                    setFormData({ ...formData, description: value })
                  }
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
              Create sale
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
          Create sale
        </Button>
      </div>
    </div>
  );
};
