'use client';

import { GlassCard, nativeCheckboxSmClassName } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { computeBookingSalePricing } from '@/features/marketing/utils/computeBookingSalePricing';
import { formatPublicSaleDiscountLabel } from '@/features/marketing/utils/formatPublicSaleDiscountLabel';
import { formatUsPhoneDigits } from '@/lib/formatUsPhone';
import React, { useId, useMemo } from 'react';
import { AddAnotherJobCard } from '../components/AddAnotherJobCard';
import type {
  CreateAppointmentAddress,
  CreateAppointmentCustomer,
  CreateAppointmentJobSnapshot,
  CreateAppointmentLocationType,
} from '../types';
import { formatCatalogPriceCents } from '../utils/catalogServiceHelpers';

function formatReviewDate(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatAddressLines(address: CreateAppointmentAddress): string[] {
  const street = address.street.trim();
  const unit = address.unit.trim();
  const line1 = [street, unit].filter(Boolean).join(', ');

  const city = address.city.trim();
  const state = address.state.trim();
  const zip = address.zip.trim();
  const cityState = [city, state].filter(Boolean).join(', ');
  const line2 = [cityState, zip].filter(Boolean).join(' ');

  return [line1, line2].filter(Boolean);
}

function jobLineTotalCents(job: CreateAppointmentJobSnapshot): number {
  return (
    job.servicePriceCents +
    job.selectedAddOns.reduce((s, a) => s + a.priceCents, 0)
  );
}

export interface ReviewStepProps {
  jobs: CreateAppointmentJobSnapshot[];
  customer: CreateAppointmentCustomer;
  locationType: CreateAppointmentLocationType | null;
  address: CreateAppointmentAddress;
  scheduledDate: string | null;
  startTime: string | null;
  notes?: string;
  activeSale?: PublicActiveSale | null;
  applySale: boolean;
  onApplySaleChange: (apply: boolean) => void;
  canAddAnotherJob: boolean;
  onAddAnotherJob?: () => void;
  addAnotherDisabled?: boolean;
}

export function ReviewStep({
  jobs,
  customer,
  locationType,
  address,
  scheduledDate,
  startTime,
  notes,
  activeSale = null,
  applySale,
  onApplySaleChange,
  canAddAnotherJob: showAddJob,
  onAddAnotherJob,
  addAnotherDisabled = false,
}: ReviewStepProps) {
  const visitSubtotalCents = useMemo(
    () => jobs.reduce((s, j) => s + jobLineTotalCents(j), 0),
    [jobs]
  );
  const visitDuration = useMemo(
    () => jobs.reduce((s, j) => s + j.durationMinutes, 0),
    [jobs]
  );

  const salePricing = useMemo(
    () =>
      computeBookingSalePricing(visitSubtotalCents, activeSale, scheduledDate),
    [visitSubtotalCents, activeSale, scheduledDate]
  );

  const showSaleToggle = Boolean(activeSale);
  const saleApplied = applySale && salePricing.saleApplies;
  const discountCents = saleApplied ? salePricing.discountCents : 0;
  const visitTotalCents = saleApplied
    ? salePricing.estimatedTotalCents
    : visitSubtotalCents;

  const saleDiscountLabel = activeSale
    ? formatPublicSaleDiscountLabel(
        activeSale.discountType,
        activeSale.discountValue,
        'off'
      )
    : null;

  const applySaleLabelId = useId();
  const applySaleLabel = activeSale
    ? saleDiscountLabel
      ? `Apply ${activeSale.name} · ${saleDiscountLabel}`
      : `Apply ${activeSale.name}`
    : 'Apply sale';

  const addressLines = formatAddressLines(address);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-200">Summary</p>

      {jobs.map(job => {
        const vehicleLine = [
          job.vehicle.year,
          job.vehicle.make,
          job.vehicle.model,
        ]
          .map(s => s.trim())
          .filter(Boolean)
          .join(' ');
        return (
          <GlassCard
            key={job.localId}
            padding="md"
            rounded="rounded-2xl"
            blurColor="bg-zinc-500"
            showBlur
            className="w-full"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div>
                  <p className="font-medium leading-snug text-white [overflow-wrap:anywhere]">
                    {job.serviceName}
                  </p>
                  {job.pricingOption?.label ? (
                    <p className="mt-0 text-xs leading-snug text-zinc-500">
                      {job.pricingOption.label}
                    </p>
                  ) : null}
                </div>
                {vehicleLine ? (
                  <p className="mt-2 text-sm text-zinc-400">{vehicleLine}</p>
                ) : null}
              </div>
              <p className="shrink-0 tabular-nums text-zinc-300">
                {formatCatalogPriceCents(job.servicePriceCents)}
              </p>
            </div>

            {job.selectedAddOns.length > 0 ? (
              <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-sm text-zinc-400">
                {job.selectedAddOns.map(a => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {a.name}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatCatalogPriceCents(a.priceCents)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </GlassCard>
        );
      })}

      <div className="space-y-3">
        <GlassCard
          padding="md"
          rounded="rounded-2xl"
          blurColor="bg-zinc-500"
          showBlur
          className="w-full"
        >
          <div className="space-y-2">
            {saleApplied ? (
              <>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="tabular-nums text-zinc-300">
                    {formatCatalogPriceCents(visitSubtotalCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">
                    {saleDiscountLabel ? `Sale · ${saleDiscountLabel}` : 'Sale'}
                  </span>
                  <span className="tabular-nums text-emerald-400">
                    −{formatCatalogPriceCents(discountCents)}
                  </span>
                </div>
                <div className="h-px bg-white/10" aria-hidden />
              </>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">
                {jobs.length > 1 ? 'Visit total' : 'Total'}
              </p>
              <p className="text-lg font-semibold tabular-nums text-white">
                {formatCatalogPriceCents(visitTotalCents)}
              </p>
            </div>
          </div>
        </GlassCard>

        {showSaleToggle && activeSale ? (
          <div className="space-y-1 px-0.5 pb-2">
            <label
              htmlFor={applySaleLabelId}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <input
                id={applySaleLabelId}
                type="checkbox"
                checked={applySale}
                onChange={e => onApplySaleChange(e.target.checked)}
                className={`cursor-pointer ${nativeCheckboxSmClassName}`}
              />
              <span className="min-w-0 text-sm text-zinc-200">
                {applySaleLabel}
              </span>
            </label>
            {applySale && !salePricing.saleApplies ? (
              <p className="pl-6 text-sm text-zinc-500">
                This sale doesn’t apply on the selected date.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full"
      >
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-sm text-zinc-500">Schedule</p>
            <p className="mt-1 text-white">
              {scheduledDate ? formatReviewDate(scheduledDate) : '—'}
            </p>
            <p className="mt-0.5 text-zinc-400">
              {startTime ? formatTime12(startTime) : '—'}
              {visitDuration > 0
                ? ` · ${formatDurationMinutes(visitDuration)}`
                : ''}
            </p>
          </div>
          <div className="h-px bg-white/10" aria-hidden />
          <div>
            <p className="text-sm text-zinc-500">Customer</p>
            <p className="mt-1 font-medium text-white">
              {customer.fullName.trim() || '—'}
            </p>
            {customer.phone.trim() ? (
              <p className="mt-0.5 text-zinc-400">
                {formatUsPhoneDigits(customer.phone)}
              </p>
            ) : null}
            {customer.email.trim() ? (
              <p className="mt-0.5 text-zinc-400">{customer.email.trim()}</p>
            ) : null}
          </div>
          <div className="h-px bg-white/10" aria-hidden />
          <div>
            <p className="text-sm text-zinc-500">
              {locationType === 'shop' ? 'Shop address' : 'Service address'}
            </p>
            {addressLines.length > 0 ? (
              <div className="mt-1 space-y-0.5 text-zinc-300">
                {addressLines.map(line => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-zinc-300">—</p>
            )}
          </div>
          {notes?.trim() ? (
            <>
              <div className="h-px bg-white/10" aria-hidden />
              <div>
                <p className="text-sm text-zinc-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-300">
                  {notes.trim()}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </GlassCard>

      {showAddJob && onAddAnotherJob ? (
        <AddAnotherJobCard
          onPress={onAddAnotherJob}
          disabled={addAnotherDisabled}
        />
      ) : null}
    </div>
  );
}
