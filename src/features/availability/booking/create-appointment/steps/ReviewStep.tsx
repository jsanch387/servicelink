'use client';

import { GlassCard } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { formatUsPhoneDigits } from '@/lib/formatUsPhone';
import React, { useMemo } from 'react';
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
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatAddressLine(address: CreateAppointmentAddress): string {
  const line1 = [address.street.trim(), address.unit.trim()]
    .filter(Boolean)
    .join(', ');
  const line2 = [
    address.city.trim(),
    address.state.trim(),
    address.zip.trim(),
  ]
    .filter(Boolean)
    .join(', ');
  return [line1, line2].filter(Boolean).join(' · ');
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
  canAddAnotherJob: showAddJob,
  onAddAnotherJob,
  addAnotherDisabled = false,
}: ReviewStepProps) {
  const visitTotalCents = useMemo(
    () => jobs.reduce((s, j) => s + jobLineTotalCents(j), 0),
    [jobs]
  );
  const visitDuration = useMemo(
    () => jobs.reduce((s, j) => s + j.durationMinutes, 0),
    [jobs]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-200">Jobs</p>
        {jobs.map((job, index) => {
          const lineTotal = jobLineTotalCents(job);
          const vehicleLine = [job.vehicle.year, job.vehicle.make, job.vehicle.model]
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
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Job {index + 1}
                  </p>
                  <p className="mt-1 font-medium text-white [overflow-wrap:anywhere]">
                    {job.serviceName}
                  </p>
                  {job.pricingOption?.label ? (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {job.pricingOption.label}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-zinc-400">
                    {formatDurationMinutes(job.durationMinutes)}
                  </p>
                  {vehicleLine ? (
                    <p className="mt-1 text-sm text-zinc-400">{vehicleLine}</p>
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

              {job.selectedAddOns.length > 0 ? (
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                  <span className="text-zinc-400">Job total</span>
                  <span className="tabular-nums font-medium text-white">
                    {formatCatalogPriceCents(lineTotal)}
                  </span>
                </div>
              ) : null}
            </GlassCard>
          );
        })}

        {showAddJob && onAddAnotherJob ? (
          <AddAnotherJobCard
            onPress={onAddAnotherJob}
            disabled={addAnotherDisabled}
          />
        ) : null}
      </div>

      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {jobs.length > 1 ? 'Visit total' : 'Total'}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatDurationMinutes(visitDuration)}
            </p>
          </div>
          <p className="text-lg font-semibold tabular-nums text-white">
            {formatCatalogPriceCents(visitTotalCents)}
          </p>
        </div>
      </GlassCard>

      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full"
      >
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Schedule
            </p>
            <p className="mt-1 text-white">
              {scheduledDate ? formatReviewDate(scheduledDate) : '—'}
            </p>
            <p className="mt-0.5 text-zinc-400">
              {startTime ? formatTime12(startTime) : '—'}
            </p>
          </div>
          <div className="h-px bg-white/10" aria-hidden />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Customer
            </p>
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
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {locationType === 'shop' ? 'Shop address' : 'Service address'}
            </p>
            <p className="mt-1 text-zinc-300">
              {formatAddressLine(address) || '—'}
            </p>
          </div>
          {notes?.trim() ? (
            <>
              <div className="h-px bg-white/10" aria-hidden />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-300">
                  {notes.trim()}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
