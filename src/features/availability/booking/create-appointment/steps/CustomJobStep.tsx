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
}

export function CustomJobStep({ draft, onChange }: CustomJobStepProps) {
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
          placeholder="e.g. Interior deep clean"
          value={draft.serviceName}
          onChange={value => onChange({ serviceName: value })}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
