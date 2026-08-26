'use client';

import { GlassCard, Input, PriceInput, TimeSelect } from '@/components/shared';
import {
  SERVICE_EDIT_DURATION_ERROR,
  parseServiceEditDurationForSave,
} from '@/features/services/utils/serviceEditForm';
import { minutesToServiceDurationHHmm } from '@/features/availability/utils/timeOptions';
import React from 'react';
import type { CreateAppointmentJobDraft } from '../types';

export interface CustomJobStepProps {
  draft: CreateAppointmentJobDraft;
  onChange: (patch: Partial<CreateAppointmentJobDraft>) => void;
  /** Membership Book visit: show Included (save $0), not a dollar input. */
  priceIncludedWithMembership?: boolean;
}

export function CustomJobStep({
  draft,
  onChange,
  priceIncludedWithMembership = false,
}: CustomJobStepProps) {
  const durationHHmm =
    draft.durationMinutes > 0
      ? minutesToServiceDurationHHmm(draft.durationMinutes)
      : '';
  const durationParsed = parseServiceEditDurationForSave(durationHHmm);
  const showDurationError =
    durationHHmm.trim().length > 0 && !durationParsed.ok;

  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur
      className="w-full"
    >
      <div className="space-y-5">
        <Input
          label="Service name"
          placeholder="e.g. Standard service"
          value={draft.serviceName}
          onChange={value => onChange({ serviceName: value })}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {priceIncludedWithMembership ? (
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-gray-200">
                Price
              </label>
              <div
                className="flex h-12 items-center rounded-xl border border-white/10 bg-white/3 px-4 text-base text-white opacity-90 sm:text-sm"
                aria-readonly="true"
              >
                Membership
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                Covered by their plan — no extra charge
              </p>
            </div>
          ) : (
            <PriceInput
              label="Price"
              placeholder="$0"
              value={draft.customPriceLabel}
              onChange={value => {
                const cents =
                  value.trim().length > 0
                    ? Math.round(Number.parseInt(value, 10) * 100)
                    : 0;
                onChange({
                  customPriceLabel: value,
                  servicePriceCents: Number.isFinite(cents) ? cents : 0,
                });
              }}
              required
            />
          )}
          <div className="min-w-0">
            <span className="mb-1.5 block text-left text-sm font-medium text-gray-200">
              Duration
              <span className="ml-1 text-red-400">*</span>
            </span>
            <TimeSelect
              variant="duration"
              value={durationHHmm}
              onChange={hhmm => {
                const parsed = parseServiceEditDurationForSave(hhmm);
                onChange({
                  durationMinutes: parsed.ok ? parsed.durationMinutes : 0,
                });
              }}
              durationPlaceholder="Select duration"
            />
            {showDurationError ? (
              <p className="mt-1.5 text-sm text-red-400">
                {SERVICE_EDIT_DURATION_ERROR}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
