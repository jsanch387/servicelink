'use client';

import {
  Button,
  Input,
  PriceInput,
  TextArea,
  TimeSelect,
} from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { saveServiceAddOnAssignmentsAction } from '@/features/services/actions/saveServiceAddOnAssignments';
import { saveServicePriceOptionsAction } from '@/features/services/actions/saveServicePriceOptions';
import { updateServiceAction } from '@/features/services/actions/updateService';
import { createAddOnAction } from '@/features/services/add-ons';
import type {
  ServicePriceOptionRow,
  ServicePriceOptionSaveInput,
  ServiceRow,
} from '@/features/services/types/services';
import {
  parseServiceEditDurationForSave,
  serviceEditDurationPickerValue,
} from '@/features/services/utils/serviceEditForm';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ServicePriceOptionsSection,
  type ServicePriceOptionDraft,
} from './ServicePriceOptionsSection';
import { EditAddOnModal } from './add-ons/EditAddOnModal';
import type { AddOnRow, EditAddOnFormData } from './add-ons/addOnTypes';

const MAX_DESCRIPTION_LENGTH = 280;

function formatPrice(cents: number): string {
  if (cents == null || cents === 0) return 'Contact for quote';
  return `$${(cents / 100).toFixed(0)}`;
}

function serviceToForm(service: ServiceRow): {
  name: string;
  description: string;
  price: string;
  durationHHmm: string;
} {
  const price =
    service.price_cents != null && service.price_cents > 0
      ? (service.price_cents / 100).toFixed(2)
      : '';
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    price,
    durationHHmm: serviceEditDurationPickerValue(service),
  };
}

export interface ServiceEditScreenProps {
  service: ServiceRow;
  /** Service price options rows (read-only hydration for now). */
  initialPriceOptions?: ServicePriceOptionRow[];
  /** Add-ons from the business pool (fetched on the page). */
  initialAddOns?: AddOnRow[];
  /** Add-on IDs currently assigned to this service (from service_addon_assignments). */
  initialSelectedAddOnIds?: string[];
  /** Back link URL (e.g. /dashboard/services). */
  backHref: string;
  /** Whether the user can use service price options (Pro or grandfathered). */
  canUsePriceOptions?: boolean;
}

/**
 * Full-page service edit screen.
 * Service details form + add-ons selection; Save updates service and assignments.
 */
export const ServiceEditScreen: React.FC<ServiceEditScreenProps> = ({
  service,
  initialPriceOptions = [],
  initialAddOns = [],
  initialSelectedAddOnIds = [],
  backHref,
  canUsePriceOptions = false,
}) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialSelectedAddOnIds)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [addOnsPool, setAddOnsPool] = useState<AddOnRow[]>(initialAddOns);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [isSavingAddOn, setIsSavingAddOn] = useState(false);
  const [addOnSaveError, setAddOnSaveError] = useState<string | null>(null);
  const [priceOptionsSubmitError, setPriceOptionsSubmitError] = useState<
    string | null
  >(null);
  const [priceOptionsEnabled, setPriceOptionsEnabled] = useState<boolean>(
    service.price_options_enabled === true
  );
  const [priceOptionsDraft, setPriceOptionsDraft] = useState<
    ServicePriceOptionDraft[]
  >([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isServiceDetailsExpanded, setIsServiceDetailsExpanded] =
    useState(false);
  const [isAddOnsExpanded, setIsAddOnsExpanded] = useState(false);

  useEffect(() => {
    const form = serviceToForm(service);
    setName(form.name);
    setDescription(form.description);
    setPrice(form.price);
    setDurationHHmm(form.durationHHmm);
    setPriceOptionsEnabled(service.price_options_enabled === true);
  }, [service]);

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
        duration_minutes: data.duration_minutes,
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
    setShowValidationErrors(true);
    setPriceOptionsSubmitError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      return;
    }
    const descriptionTrim = description.trim();
    if (!descriptionTrim) {
      return;
    }
    const priceNum = price.trim() ? parseFloat(price.replace(/,/g, '')) : NaN;
    if (!price.trim() || isNaN(priceNum) || priceNum < 0) {
      return;
    }
    const priceCents = Math.round(priceNum * 100);
    const durationResult = parseServiceEditDurationForSave(durationHHmm);
    if (!durationResult.ok) {
      return;
    }
    const durationMinutes = durationResult.durationMinutes;

    const canEditPriceOptions = canUsePriceOptions && priceOptionsEnabled;
    let validatedPriceOptions: ServicePriceOptionSaveInput[] = [];
    if (canEditPriceOptions) {
      if (priceOptionsDraft.length === 0) {
        return;
      }

      const parsedOptions: ServicePriceOptionSaveInput[] = [];
      for (let i = 0; i < priceOptionsDraft.length; i += 1) {
        const opt = priceOptionsDraft[i];
        const label = opt.label.trim();
        if (!label) {
          return;
        }
        const rawPrice = opt.price.trim().replace(/,/g, '');
        const priceNum = rawPrice ? parseFloat(rawPrice) : NaN;
        if (!rawPrice || Number.isNaN(priceNum) || priceNum < 0) {
          return;
        }
        const optDuration = parseServiceEditDurationForSave(opt.durationHHmm);
        if (!optDuration.ok) {
          return;
        }
        parsedOptions.push({
          label,
          price_cents: Math.round(priceNum * 100),
          duration_minutes: optDuration.durationMinutes,
          sort_order: i,
          is_active: true,
        });
      }
      validatedPriceOptions = parsedOptions;
    }

    setIsSaving(true);

    const validAddOnIds = Array.from(selectedAddOnIds).filter(id =>
      addOnsPool.some(a => a.id === id)
    );

    const requests: Promise<
      | Awaited<ReturnType<typeof updateServiceAction>>
      | Awaited<ReturnType<typeof saveServiceAddOnAssignmentsAction>>
      | Awaited<ReturnType<typeof saveServicePriceOptionsAction>>
    >[] = [
      updateServiceAction(service.id, {
        name: nameTrim,
        description: descriptionTrim,
        price_cents: priceCents,
        duration_minutes: durationMinutes,
        // Users without access can still edit service details, but cannot change this setting.
        price_options_enabled: canUsePriceOptions
          ? priceOptionsEnabled
          : service.price_options_enabled === true,
      }),
      saveServiceAddOnAssignmentsAction(service.id, validAddOnIds),
    ];
    if (canEditPriceOptions) {
      requests.push(
        saveServicePriceOptionsAction(service.id, validatedPriceOptions)
      );
    }
    const [updateResult, assignmentsResult, optionsResult] =
      await Promise.all(requests);

    setIsSaving(false);

    if (!updateResult.success) {
      setPriceOptionsSubmitError(
        updateResult.error ?? 'Could not save changes.'
      );
      return;
    }
    if (!assignmentsResult.success) {
      setPriceOptionsSubmitError(
        assignmentsResult.error ?? 'Could not save add-on selection.'
      );
      return;
    }
    if (canEditPriceOptions && optionsResult && !optionsResult.success) {
      setPriceOptionsSubmitError(
        optionsResult.error ?? 'Could not save price options.'
      );
      return;
    }

    router.refresh();
  }, [
    name,
    description,
    price,
    durationHHmm,
    selectedAddOnIds,
    addOnsPool,
    priceOptionsEnabled,
    priceOptionsDraft,
    service.id,
    service.price_options_enabled,
    canUsePriceOptions,
    router,
  ]);

  const serviceSummaryName = name.trim() || 'Unnamed service';

  const selectedAddOnsCount = selectedAddOnIds.size;

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
            <button
              type="button"
              onClick={() => setIsServiceDetailsExpanded(prev => !prev)}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
              aria-expanded={isServiceDetailsExpanded}
            >
              <div className="min-w-0">
                <h2 className="text-lg sm:text-base font-bold text-white tracking-tight">
                  Service details
                </h2>
                {!isServiceDetailsExpanded ? (
                  <p className="text-xs text-gray-400 mt-1 leading-snug break-words">
                    {serviceSummaryName}
                  </p>
                ) : null}
              </div>
              {isServiceDetailsExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400 shrink-0" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0" />
              )}
            </button>

            {isServiceDetailsExpanded && (
              <form
                className="space-y-4 sm:space-y-5 mt-4"
                onSubmit={e => e.preventDefault()}
              >
                <Input
                  label="Service name"
                  placeholder="e.g., House Cleaning, Logo Design"
                  value={name}
                  onChange={setName}
                  error={
                    showValidationErrors && !name.trim()
                      ? 'Service name is required.'
                      : undefined
                  }
                />
                <div className="space-y-2">
                  <TextArea
                    label="Description"
                    placeholder="Tell customers what they get."
                    value={description}
                    onChange={setDescription}
                    rows={3}
                    error={
                      showValidationErrors && !description.trim()
                        ? 'Description is required.'
                        : undefined
                    }
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
                    error={
                      showValidationErrors &&
                      (!price.trim() || Number.isNaN(parseFloat(price)))
                        ? 'Price is required.'
                        : undefined
                    }
                  />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-gray-200 mb-1.5">
                      Duration
                    </span>
                    <TimeSelect
                      variant="duration"
                      value={durationHHmm}
                      onChange={setDurationHHmm}
                      durationPlaceholder="Select duration"
                    />
                    {showValidationErrors &&
                    !parseServiceEditDurationForSave(durationHHmm).ok ? (
                      <p className="mt-1.5 text-sm text-red-400">
                        Duration is required.
                      </p>
                    ) : null}
                  </div>
                </div>
              </form>
            )}
          </section>

          <ServicePriceOptionsSection
            service={service}
            initialEnabled={
              canUsePriceOptions ? service.price_options_enabled === true : true
            }
            initialOptions={initialPriceOptions}
            onChange={(enabled, options) => {
              setPriceOptionsEnabled(enabled);
              setPriceOptionsDraft(options);
              setPriceOptionsSubmitError(null);
            }}
            showValidationErrors={showValidationErrors && priceOptionsEnabled}
            submitErrorMessage={priceOptionsSubmitError}
            isLocked={!canUsePriceOptions}
            upgradeHref={ROUTES.DASHBOARD.UPGRADE}
          />

          {/* Add-ons section — pool from DB; user selects which to offer for this service */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8">
            <button
              type="button"
              onClick={() => setIsAddOnsExpanded(prev => !prev)}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
              aria-expanded={isAddOnsExpanded}
            >
              <div className="min-w-0">
                <h2 className="text-lg sm:text-base font-bold text-white tracking-tight">
                  Add-ons
                </h2>
                {!isAddOnsExpanded ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedAddOnsCount} selected
                  </p>
                ) : null}
              </div>
              {isAddOnsExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400 shrink-0" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0" />
              )}
            </button>
            {isAddOnsExpanded && (
              <>
                {addOnsPool.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    No add-ons yet. Create some in the Add-ons tab first.
                  </p>
                ) : (
                  <div
                    className="mt-4 space-y-2"
                    role="group"
                    aria-label="Add-ons for this service"
                  >
                    {addOnsPool.map(addOn => {
                      const isSelected = selectedAddOnIds.has(addOn.id);
                      const addOnDuration =
                        addOn.duration_minutes != null &&
                        addOn.duration_minutes > 0
                          ? formatDurationMinutes(addOn.duration_minutes)
                          : null;
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
                          aria-label={`${addOn.name}, ${formatPrice(addOn.price_cents)}${addOnDuration ? `, ${addOnDuration} extra` : ''}. ${isSelected ? 'Selected' : 'Not selected'}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="font-medium truncate block">
                              {addOn.name}
                            </span>
                            {addOnDuration ? (
                              <span className="text-xs text-zinc-500 mt-0.5 block">
                                +{addOnDuration}
                              </span>
                            ) : null}
                          </span>
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
              </>
            )}
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
