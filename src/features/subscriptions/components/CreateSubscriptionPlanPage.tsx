'use client';

import {
  Button,
  GlassCard,
  IconButton,
  Input,
  PriceInput,
  TextArea,
  toast,
} from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import {
  insertServiceDescriptionBullet,
  SERVICE_DESCRIPTION_MAX_LENGTH,
} from '@/features/business-profile/utils/serviceDescriptionDisplay';
import {
  ChevronLeftIcon,
  ListBulletIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { SubscriptionCadenceOption } from '../types/customerSubscriptionPlan';
import {
  OWNER_CADENCE_PRESETS,
  type CreatePlanWizardStep,
  type OwnerCadencePresetId,
  type OwnerSubscriptionPlan,
} from '../types/ownerSubscriptionPlan';
import {
  formatCadenceOptionLabel,
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';
import { joinDescriptionAndBenefits } from '../utils/planDescription';
import { SubscriptionPlanReadySuccess } from './SubscriptionPlanReadySuccess';

const CREATE_STEP_META: Record<
  CreatePlanWizardStep,
  { title: string; lead: string }
> = {
  name: {
    title: 'Name your plan',
    lead: 'Give your plan a clear name customers will recognize.',
  },
  cadence: {
    title: 'How often',
    lead: 'Pick a schedule, set a price, then add it as a plan option.',
  },
  description: {
    title: 'Description',
    lead: 'Add a short description. Customers will see this on your booking link.',
  },
};

const EDIT_STEP_META: Record<
  CreatePlanWizardStep,
  { title: string; lead: string }
> = {
  name: {
    title: 'Edit plan name',
    lead: 'Update the name customers see on your booking link.',
  },
  cadence: {
    title: 'Edit pricing',
    lead: 'Change schedules and prices for this plan.',
  },
  description: {
    title: 'Edit description',
    lead: 'Update what customers read before they subscribe.',
  },
};

function hydrateOptions(
  plan: OwnerSubscriptionPlan
): SubscriptionCadenceOption[] {
  return plan.cadenceOptions.map(option => ({
    id: option.id,
    intervalUnit: option.intervalUnit,
    intervalCount: option.intervalCount,
    priceCents: option.priceCents,
    isDefault: option.isDefault,
  }));
}

interface CreateSubscriptionPlanPageProps {
  mode?: 'create' | 'edit';
  initialPlan?: OwnerSubscriptionPlan;
}

export const CreateSubscriptionPlanPage: React.FC<
  CreateSubscriptionPlanPageProps
> = ({ mode = 'create', initialPlan }) => {
  const router = useRouter();
  const isEdit = mode === 'edit' && Boolean(initialPlan);
  const backHref = isEdit
    ? ROUTES.DASHBOARD.SUBSCRIPTIONS_DETAIL(initialPlan!.id)
    : ROUTES.DASHBOARD.SUBSCRIPTIONS;
  const stepMeta = isEdit ? EDIT_STEP_META : CREATE_STEP_META;

  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [step, setStep] = useState<CreatePlanWizardStep>('name');
  const [name, setName] = useState(initialPlan?.name ?? '');
  const [description, setDescription] = useState(
    initialPlan
      ? joinDescriptionAndBenefits(
          initialPlan.description,
          initialPlan.benefits
        )
      : ''
  );
  const [selectedPreset, setSelectedPreset] =
    useState<OwnerCadencePresetId | null>('monthly');
  const [priceDollars, setPriceDollars] = useState('');
  const [options, setOptions] = useState<SubscriptionCadenceOption[]>(() =>
    initialPlan ? hydrateOptions(initialPlan) : []
  );
  const [cadenceError, setCadenceError] = useState<string | null>(null);
  const [createdPlan, setCreatedPlan] = useState<OwnerSubscriptionPlan | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleInsertDescriptionBullet = useCallback(() => {
    const el = descriptionTextareaRef.current;
    const start = el?.selectionStart ?? description.length;
    const end = el?.selectionEnd ?? description.length;
    const { value: next, caret } = insertServiceDescriptionBullet(
      description,
      start,
      end
    );
    setDescription(next);
    setTimeout(() => {
      const node = descriptionTextareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(caret, caret);
    }, 0);
  }, [description]);

  const canContinueName = name.trim().length > 0;
  const canContinueCadence = options.length > 0;
  const stepIndex = step === 'name' ? 0 : step === 'cadence' ? 1 : 2;

  const usedPresetIds = useMemo(() => {
    const ids = new Set<OwnerCadencePresetId>();
    for (const option of options) {
      const match = OWNER_CADENCE_PRESETS.find(
        preset =>
          preset.intervalUnit === option.intervalUnit &&
          preset.intervalCount === option.intervalCount
      );
      if (match) ids.add(match.id);
    }
    return ids;
  }, [options]);

  const handleAddOption = () => {
    setCadenceError(null);
    if (!selectedPreset) {
      setCadenceError('Pick how often first.');
      return;
    }
    const dollars = Number.parseInt(priceDollars, 10);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setCadenceError('Enter a price.');
      return;
    }
    if (usedPresetIds.has(selectedPreset)) {
      setCadenceError('That schedule is already added.');
      return;
    }

    const preset = OWNER_CADENCE_PRESETS.find(
      item => item.id === selectedPreset
    );
    if (!preset) return;

    setOptions(prev => [
      ...prev,
      {
        id: `opt-${preset.id}-${Date.now()}`,
        intervalUnit: preset.intervalUnit,
        intervalCount: preset.intervalCount,
        priceCents: dollars * 100,
      },
    ]);
    setPriceDollars('');
  };

  const handleRemoveOption = (optionId: string) => {
    setOptions(prev => prev.filter(option => option.id !== optionId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        cadenceOptions: options.map(option => ({
          intervalUnit: option.intervalUnit,
          intervalCount: option.intervalCount,
          priceCents: option.priceCents,
        })),
      };

      const res = await fetch(
        isEdit
          ? API_ROUTES.MEMBERSHIPS_PLAN(initialPlan!.id)
          : API_ROUTES.MEMBERSHIPS_PLANS,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        plan?: OwnerSubscriptionPlan;
        error?: string;
      } | null;

      if (!res.ok || !json?.success || !json.plan) {
        toast.error(
          json?.error ??
            (isEdit
              ? 'Could not save plan. Try again.'
              : 'Could not create plan. Try again.')
        );
        return;
      }

      if (isEdit) {
        toast.success('Plan updated.');
        router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS_DETAIL(json.plan.id));
        router.refresh();
        return;
      }

      setCreatedPlan(json.plan);
    } catch {
      toast.error(
        isEdit
          ? 'Could not save plan. Try again.'
          : 'Could not create plan. Try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (createdPlan) {
    return (
      <SubscriptionPlanReadySuccess
        plan={createdPlan}
        onContinue={() => {
          router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS);
          router.refresh();
        }}
      />
    );
  }

  const meta = stepMeta[step];

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <Link
          href={backHref}
          className="mb-6 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          {isEdit ? 'Plan' : 'Subscriptions'}
        </Link>

        <div className="mx-auto w-full max-w-xl pt-6 sm:pt-10">
          <div className="mb-6 flex gap-1.5" aria-hidden>
            {(['name', 'cadence', 'description'] as const).map(
              (item, index) => (
                <span
                  key={item}
                  className={`h-1.5 flex-1 rounded-full ${
                    index <= stepIndex ? 'bg-white/80' : 'bg-white/10'
                  }`}
                />
              )
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm leading-snug text-gray-500">{meta.lead}</p>

          {step === 'name' || step === 'cadence' ? (
            <GlassCard
              padding="lg"
              rounded="rounded-2xl"
              className="mt-6 !h-auto w-full"
            >
              {step === 'name' ? (
                <div className="space-y-5">
                  <Input
                    label="Plan name"
                    placeholder="e.g. Exterior Wash"
                    value={name}
                    onChange={setName}
                    required
                  />
                  <Button
                    type="button"
                    variant="inverse"
                    fullWidth
                    disabled={!canContinueName}
                    onClick={() => setStep('cadence')}
                  >
                    Continue
                  </Button>
                </div>
              ) : null}

              {step === 'cadence' ? (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-200">
                      How often
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {OWNER_CADENCE_PRESETS.map(preset => {
                        const active = selectedPreset === preset.id;
                        const alreadyAdded = usedPresetIds.has(preset.id);
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => setSelectedPreset(preset.id)}
                            className={`cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              active
                                ? 'bg-white text-black'
                                : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-full border border-dashed border-white/15 px-3.5 py-2 text-sm font-medium text-gray-500 opacity-60"
                        title="Custom schedules coming soon"
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <PriceInput
                        label="Price"
                        placeholder="0"
                        value={priceDollars}
                        onChange={setPriceDollars}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-12 shrink-0"
                      icon={<PlusIcon className="h-4 w-4" aria-hidden />}
                      onClick={handleAddOption}
                    >
                      Add
                    </Button>
                  </div>

                  {cadenceError ? (
                    <p className="text-sm text-red-300" role="alert">
                      {cadenceError}
                    </p>
                  ) : null}

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-200">
                      Plan options
                    </p>
                    {options.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-gray-500">
                        Add at least one schedule option.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {options.map(option => (
                          <li
                            key={option.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">
                                {formatCadenceOptionLabel(option)}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {formatSubscriptionPriceCents(
                                  option.priceCents
                                )}
                                {formatCadencePriceSuffix(option)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(option.id)}
                              className="cursor-pointer rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                              aria-label="Remove option"
                            >
                              <TrashIcon className="h-4 w-4" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="secondary"
                      className="sm:flex-1"
                      onClick={() => setStep('name')}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="inverse"
                      className="sm:flex-1"
                      disabled={!canContinueCadence}
                      onClick={() => setStep('description')}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              ) : null}
            </GlassCard>
          ) : null}

          {step === 'description' ? (
            <div className="mt-6 space-y-5">
              <TextArea
                ref={descriptionTextareaRef}
                label="Description"
                placeholder="Tell customers what they get."
                footerStart={
                  <IconButton
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10 -mr-1"
                    title="Insert bullet"
                    aria-label="Insert bullet"
                    icon={<ListBulletIcon className="h-5 w-5" />}
                    onClick={handleInsertDescriptionBullet}
                  />
                }
                value={description}
                onChange={setDescription}
                rows={5}
                maxLength={SERVICE_DESCRIPTION_MAX_LENGTH}
                inputClassName="resize-y min-h-[7.5rem]"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="sm:flex-1"
                  onClick={() => setStep('cadence')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="inverse"
                  className="sm:flex-1"
                  onClick={handleSave}
                  disabled={isSaving}
                  loading={isSaving}
                >
                  {isEdit ? 'Save changes' : 'Create plan'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
};
