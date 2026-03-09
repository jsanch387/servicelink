'use client';

import {
  Button,
  Input,
  PriceInput,
  Select,
  SERVICE_DURATION_HOURS_OPTIONS,
  TextArea,
} from '@/components/shared';
import type { ServiceRow } from '@/features/services/types/services';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import type { AddOnRow } from './add-ons/addOnTypes';
import { MOCK_ADDONS_POOL } from './add-ons/mockAddOnsPool';

const DURATION_OPTIONS = [
  { value: '', label: 'Select duration' },
  ...SERVICE_DURATION_HOURS_OPTIONS,
];

const MAX_DESCRIPTION_LENGTH = 280;

function formatPrice(cents: number): string {
  if (cents == null || cents === 0) return 'Contact for quote';
  return `$${(cents / 100).toFixed(0)}`;
}

function serviceToForm(service: ServiceRow): {
  name: string;
  description: string;
  price: string;
  durationHours: string;
} {
  const price =
    service.price_cents != null && service.price_cents > 0
      ? (service.price_cents / 100).toFixed(2)
      : '';
  const durationMinutes =
    service.duration_minutes ??
    (service.hours_to_complete != null
      ? Math.round(service.hours_to_complete * 60)
      : null);
  const hoursForSelect =
    durationMinutes != null && durationMinutes > 0
      ? Math.min(10, Math.max(1, Math.round(durationMinutes / 60)))
      : null;
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    price,
    durationHours: hoursForSelect != null ? String(hoursForSelect) : '',
  };
}

export interface ServiceEditScreenProps {
  service: ServiceRow;
  /** Mock: which add-on IDs are selected for this service. */
  initialSelectedAddOnIds?: string[];
  /** Back link URL (e.g. /dashboard/services). */
  backHref: string;
}

/**
 * Full-page service edit screen.
 * Service details form + add-ons checkbox section.
 * UI only; no save/update logic yet.
 */
export const ServiceEditScreen: React.FC<ServiceEditScreenProps> = ({
  service,
  initialSelectedAddOnIds = [],
  backHref,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialSelectedAddOnIds)
  );

  const addOnsPool: AddOnRow[] = MOCK_ADDONS_POOL;

  useEffect(() => {
    const form = serviceToForm(service);
    setName(form.name);
    setDescription(form.description);
    setPrice(form.price);
    setDurationHours(form.durationHours);
  }, [service]);

  const handleAddOnToggle = useCallback((addOnId: string) => {
    setSelectedAddOnIds(prev => {
      const next = new Set(prev);
      if (next.has(addOnId)) next.delete(addOnId);
      else next.add(addOnId);
      return next;
    });
  }, []);

  const handleAddNewAddOn = useCallback(() => {
    // Placeholder - no functionality yet
  }, []);

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[var(--dashboard-bg)]">
      <div className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto pb-24">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 min-h-[44px] py-2 -ml-2 pl-2 pr-2 text-gray-400 hover:text-white active:text-white transition-colors mb-4 touch-manipulation"
          aria-label="Back to services"
        >
          <ArrowLeftIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Back to services</span>
        </Link>
        <div className="max-w-2xl mx-auto w-full min-w-0 pt-0 sm:pt-6">
          <h1 className="text-xl font-bold text-white mb-4 sm:mb-6">
            Edit service
          </h1>

          {/* Service details */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base font-semibold text-white mb-4">
              Service details
            </h2>
            <form
              className="space-y-4 sm:space-y-5"
              onSubmit={e => e.preventDefault()}
            >
              <Input
                label="Service name"
                placeholder="e.g., House Cleaning, Logo Design"
                value={name}
                onChange={setName}
              />
              <div className="space-y-2">
                <TextArea
                  label="Description"
                  placeholder="Tell customers what they get."
                  value={description}
                  onChange={setDescription}
                  rows={3}
                />
                <div className="flex justify-end text-xs text-gray-500">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <PriceInput
                  label="Price"
                  placeholder="0.00"
                  value={price}
                  onChange={setPrice}
                />
                <Select
                  label="Duration"
                  placeholder="Select duration"
                  value={durationHours}
                  onChange={setDurationHours}
                  options={DURATION_OPTIONS}
                />
              </div>
            </form>
          </section>

          {/* Add-ons section */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base font-semibold text-white mb-1">
              Add-ons for this service
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Pick which add-ons to offer with this service.
            </p>
            {addOnsPool.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                No add-ons yet. Create some in the Add-ons tab first.
              </p>
            ) : null}
            <div
              className="space-y-2"
              role="group"
              aria-label="Add-ons for this service"
            >
              {addOnsPool.map(addOn => {
                const isSelected = selectedAddOnIds.has(addOn.id);
                return (
                  <button
                    key={addOn.id}
                    type="button"
                    onClick={() => handleAddOnToggle(addOn.id)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer touch-manipulation min-h-[52px] ${
                      isSelected
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`${addOn.name}, ${formatPrice(addOn.price_cents)}. ${isSelected ? 'Selected' : 'Not selected'}`}
                  >
                    <span className="font-medium truncate">{addOn.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-zinc-400">
                        {formatPrice(addOn.price_cents)}
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                          isSelected
                            ? 'border-white/40 bg-white/20'
                            : 'border-white/20 bg-transparent'
                        }`}
                        aria-hidden
                      >
                        {isSelected ? (
                          <CheckIcon className="h-3.5 w-3.5 text-white" />
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })}
              {/* Add-as-card: matches list style, natural tap target (mobile UX pattern) */}
              <Button
                variant="outline"
                size="md"
                onClick={handleAddNewAddOn}
                icon={<PlusIcon className="h-5 w-5 text-emerald-500" />}
                fullWidth
                aria-label="Add new add-on"
                className="!border-2 !border-dashed !border-white/20 !bg-white/[0.02] !text-emerald-500 hover:!border-emerald-500/40 hover:!bg-emerald-500/5 hover:!text-emerald-400 !rounded-xl min-h-[52px] py-3"
              >
                Add new add-on
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky bottom actions — matches availability page pattern */}
      <div
        className="sticky bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 safe-area-pb"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col-reverse sm:flex-row gap-3">
          <Link
            href={backHref}
            className="w-full sm:w-auto min-h-[48px] flex items-center justify-center px-4 py-3 rounded-xl text-base font-medium border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 active:bg-white/15 transition-all text-center touch-manipulation"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="w-full sm:flex-1 min-h-[48px] px-4 py-3 rounded-xl text-base font-medium bg-white hover:bg-gray-100 active:bg-gray-200 text-black transition-all cursor-pointer touch-manipulation"
          >
            Save changes
          </button>
        </div>
      </div>
    </main>
  );
};
