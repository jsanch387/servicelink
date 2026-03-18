'use client';

import {
  Button,
  Input,
  PriceInput,
  Select,
  SERVICE_DURATION_HOURS_OPTIONS,
  Switch,
  TextArea,
} from '@/components/shared';
import { saveServiceAddOnAssignmentsAction } from '@/features/services/actions/saveServiceAddOnAssignments';
import { updateServiceAction } from '@/features/services/actions/updateService';
import { createAddOnAction } from '@/features/services/add-ons';
import type { ServiceRow } from '@/features/services/types/services';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import type { AddOnRow, EditAddOnFormData } from './add-ons/addOnTypes';
import { EditAddOnModal } from './add-ons/EditAddOnModal';

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
  /** Add-ons from the business pool (fetched on the page). */
  initialAddOns?: AddOnRow[];
  /** Add-on IDs currently assigned to this service (from service_addon_assignments). */
  initialSelectedAddOnIds?: string[];
  /** Back link URL (e.g. /dashboard/services). */
  backHref: string;
  /**
   * From business profile type (e.g. Auto & Detailing). When true, show booking
   * options like "ask for year/make/model".
   */
  showVehicleBookingOptions?: boolean;
}

/**
 * Full-page service edit screen.
 * Service details form + add-ons selection; Save updates service and assignments.
 */
export const ServiceEditScreen: React.FC<ServiceEditScreenProps> = ({
  service,
  initialAddOns = [],
  initialSelectedAddOnIds = [],
  backHref,
  showVehicleBookingOptions = false,
}) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialSelectedAddOnIds)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addOnsPool, setAddOnsPool] = useState<AddOnRow[]>(initialAddOns);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [isSavingAddOn, setIsSavingAddOn] = useState(false);
  const [addOnSaveError, setAddOnSaveError] = useState<string | null>(null);
  const [askVehicleDetails, setAskVehicleDetails] = useState<boolean>(
    showVehicleBookingOptions
  );

  useEffect(() => {
    const form = serviceToForm(service);
    setName(form.name);
    setDescription(form.description);
    setPrice(form.price);
    setDurationHours(form.durationHours);
  }, [service]);

  // Sync when business type implies vehicle booking options (e.g. after profile edit).
  useEffect(() => {
    if (showVehicleBookingOptions) {
      setAskVehicleDetails(true);
    } else {
      setAskVehicleDetails(false);
    }
  }, [showVehicleBookingOptions]);

  useEffect(() => {
    setSelectedAddOnIds(new Set(initialSelectedAddOnIds));
  }, [initialSelectedAddOnIds]);

  useEffect(() => {
    setAddOnsPool(initialAddOns);
  }, [initialAddOns]);

  const handleAddOnToggle = useCallback((addOnId: string) => {
    setSelectedAddOnIds(prev => {
      const next = new Set(prev);
      if (next.has(addOnId)) next.delete(addOnId);
      else next.add(addOnId);
      return next;
    });
  }, []);

  const handleAddNewAddOn = useCallback(() => {
    setAddOnSaveError(null);
    setIsAddOnModalOpen(true);
  }, []);

  const handleAddOnModalSave = useCallback(
    async (addOnId: string | undefined, data: EditAddOnFormData) => {
      if (addOnId) return;
      setAddOnSaveError(null);
      setIsSavingAddOn(true);
      const createResult = await createAddOnAction({
        name: data.name,
        price_cents: data.price_cents ?? 0,
      });
      if (!createResult.success || !createResult.data) {
        setIsSavingAddOn(false);
        setAddOnSaveError(createResult.error ?? 'Failed to add add-on.');
        return;
      }
      const newAddOn = createResult.data;
      const validPoolIds = new Set([...addOnsPool.map(a => a.id), newAddOn.id]);
      const newSelectedIds = [...selectedAddOnIds, newAddOn.id].filter(id =>
        validPoolIds.has(id)
      );
      const assignResult = await saveServiceAddOnAssignmentsAction(
        service.id,
        newSelectedIds
      );
      setIsSavingAddOn(false);
      if (!assignResult.success) {
        setAddOnSaveError(
          assignResult.error ?? 'Failed to assign add-on to this service.'
        );
        return;
      }
      setAddOnsPool(prev => [...prev, newAddOn]);
      setSelectedAddOnIds(new Set(newSelectedIds));
      setIsAddOnModalOpen(false);
      router.refresh();
    },
    [addOnsPool, selectedAddOnIds, service.id, router]
  );

  const handleSave = useCallback(async () => {
    setSaveError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError('Service name is required.');
      return;
    }
    const priceNum = price.trim() ? parseFloat(price.replace(/,/g, '')) : NaN;
    const priceCents =
      !price.trim() || isNaN(priceNum) || priceNum < 0
        ? null
        : Math.round(priceNum * 100);
    const durationMinutes = durationHours
      ? parseInt(durationHours, 10) * 60
      : null;

    setIsSaving(true);

    const validAddOnIds = Array.from(selectedAddOnIds).filter(id =>
      addOnsPool.some(a => a.id === id)
    );

    const [updateResult, assignmentsResult] = await Promise.all([
      updateServiceAction(service.id, {
        name: nameTrim,
        description: description.trim() || '',
        price_cents: priceCents,
        duration_minutes: durationMinutes,
      }),
      saveServiceAddOnAssignmentsAction(service.id, validAddOnIds),
    ]);

    setIsSaving(false);

    if (!updateResult.success) {
      setSaveError(updateResult.error ?? 'Failed to save service.');
      return;
    }
    if (!assignmentsResult.success) {
      setSaveError(
        assignmentsResult.error ?? 'Failed to save add-on selection.'
      );
      return;
    }

    router.push(backHref);
    router.refresh();
  }, [
    name,
    description,
    price,
    durationHours,
    selectedAddOnIds,
    addOnsPool,
    service.id,
    backHref,
    router,
  ]);

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

          {/* Booking options – shown for vehicle-related services */}
          {showVehicleBookingOptions && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-base font-semibold text-white mb-1">
                Booking options
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                For vehicle services, you can ask customers for year, make, and
                model when they book.
              </p>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    Ask for vehicle details
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Customers will be asked for year, make, and model on the
                    booking form.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    size="md"
                    checked={askVehicleDetails}
                    onCheckedChange={setAskVehicleDetails}
                    aria-label="Ask customers for vehicle details (year, make, model)"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Add-ons section — pool from DB; user selects which to offer for this service */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base font-semibold text-white mb-1">
              Add-ons for this service
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Pick which add-ons to offer with this service.
            </p>
            {saveError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                {saveError}
              </p>
            )}
            {addOnsPool.length === 0 ? (
              <p className="text-sm text-gray-500">
                No add-ons yet. Create some in the Add-ons tab first.
              </p>
            ) : (
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
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleAddNewAddOn}
              icon={<PlusIcon className="h-5 w-5 text-emerald-500" />}
              fullWidth
              aria-label="Add new add-on"
              className="!border-2 !border-dashed !border-white/20 !bg-white/[0.02] !text-emerald-500 hover:!border-emerald-500/40 hover:!bg-emerald-500/5 hover:!text-emerald-400 !rounded-xl min-h-[52px] py-3 mt-4"
            >
              Add new add-on
            </Button>
          </section>
        </div>
      </div>

      <EditAddOnModal
        addOn={null}
        showAddForm={isAddOnModalOpen}
        saveError={addOnSaveError}
        onClose={() => {
          setAddOnSaveError(null);
          setIsAddOnModalOpen(false);
        }}
        onSave={handleAddOnModalSave}
        isSaving={isSavingAddOn}
      />

      {/* Sticky bottom actions */}
      <div
        className="sticky bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 safe-area-pb"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col-reverse sm:flex-row gap-3">
          <Button
            href={backHref}
            variant="secondary"
            className="w-full sm:w-auto flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            variant="inverse"
            loading={isSaving}
            disabled={isSaving}
            className="w-full sm:flex-1"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </main>
  );
};
