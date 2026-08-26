'use client';

import { GlassCard } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { BookingSaleAppliesNotice } from '@/features/marketing/components/BookingSaleAppliesNotice';
import { formatCatalogPriceCents } from '@/features/availability/booking/create-appointment/utils/catalogServiceHelpers';
import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import React, { useMemo } from 'react';
import { AddAnotherJobCard } from '../create-appointment/components/AddAnotherJobCard';
import type { CustomerFormData, PublicBookingJobDraft } from '../types';
import { formatBookingWallTime } from '../utils/formatBookingWallTime';
import { formatDurationMinutes } from '../utils/formatDuration';
import {
  sumPublicBookingJobsDurationMinutes,
  sumPublicBookingJobsGrossCents,
} from '../utils/publicBookingJobsCart';

function formatAddressLines(customer: CustomerFormData): string[] {
  const street = customer.streetAddress.trim();
  const unit = customer.unitApt.trim();
  const line1 = [street, unit].filter(Boolean).join(', ');
  const city = customer.city.trim();
  const state = customer.state.trim();
  const zip = customer.zip.trim();
  const cityState = [city, state].filter(Boolean).join(', ');
  const line2 = [cityState, zip].filter(Boolean).join(' ');
  return [line1, line2].filter(Boolean);
}

export type PublicMultiJobReviewSummaryProps = {
  jobs: PublicBookingJobDraft[];
  customer: CustomerFormData;
  /** Local calendar day `YYYY-MM-DD`. */
  scheduledDateYmd: string;
  startTimeHhmm: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
  isShopBooking?: boolean;
  shopAddressLabel?: string | null;
  hideServiceAddress?: boolean;
  saleSubtotalCents?: number;
  saleEstimatedTotalCents?: number;
  saleDiscountCents?: number;
  saleAppliesLine?: string | null;
  canAddAnotherJob?: boolean;
  onAddAnotherJob?: () => void;
  addAnotherLabel?: string;
  canRemoveJob?: boolean;
  onRemoveJob?: (localId: string) => void;
  removeLabel?: string;
};

/**
 * Public multi-job review — same card layout as owner create-appointment ReviewStep.
 */
export function PublicMultiJobReviewSummary({
  jobs,
  customer,
  scheduledDateYmd,
  startTimeHhmm,
  bookingFlowLocale = 'en',
  isShopBooking = false,
  shopAddressLabel = null,
  hideServiceAddress = false,
  saleSubtotalCents,
  saleEstimatedTotalCents,
  saleDiscountCents,
  saleAppliesLine,
  canAddAnotherJob = false,
  onAddAnotherJob,
  addAnotherLabel,
  canRemoveJob = false,
  onRemoveJob,
  removeLabel,
}: PublicMultiJobReviewSummaryProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const sl = ui.serviceLocation;
  const removeText = removeLabel ?? ui.multiJob.remove;

  const visitSubtotalCents = useMemo(
    () => sumPublicBookingJobsGrossCents(jobs),
    [jobs]
  );
  const visitDuration = useMemo(
    () => sumPublicBookingJobsDurationMinutes(jobs),
    [jobs]
  );

  const showSalePricing =
    Boolean(saleAppliesLine) &&
    saleSubtotalCents != null &&
    saleSubtotalCents > 0 &&
    saleEstimatedTotalCents != null &&
    saleEstimatedTotalCents < saleSubtotalCents;

  const visitTotalCents = showSalePricing
    ? saleEstimatedTotalCents!
    : visitSubtotalCents;

  const dateFormatted = new Date(
    `${scheduledDateYmd}T12:00:00`
  ).toLocaleDateString(bcp47ForBookingLocale(bookingFlowLocale), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeDisplay = formatBookingWallTime(startTimeHhmm, bookingFlowLocale);

  const addressLines = isShopBooking
    ? shopAddressLabel?.trim()
      ? [shopAddressLabel.trim()]
      : []
    : formatAddressLines(customer);
  const showAddress = !hideServiceAddress && addressLines.length > 0;
  const addressLabel = isShopBooking
    ? sl.shopVisitAddressLabel
    : ui.common.address;

  const email = customer.email.trim();
  const phone = formatPhoneUsDisplay(customer.phone);
  const notes = customer.notes.trim();

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-200">{ui.common.summary}</p>

      {jobs.map(job => {
        const vehicleLine = [
          job.vehicle.year,
          job.vehicle.make,
          job.vehicle.model,
        ]
          .map(s => s.trim())
          .filter(Boolean)
          .join(' ');
        const petIdentity = [job.pet?.name, job.pet?.breed]
          .map(s => (s ?? '').trim())
          .filter(Boolean)
          .join(' · ');
        const petExtras = [job.pet?.species, job.pet?.size]
          .map(s => (s ?? '').trim())
          .filter(Boolean)
          .join(' · ');
        const petLine =
          petIdentity && petExtras
            ? `${petIdentity} · ${petExtras}`
            : petIdentity || petExtras;
        const optionLabel = job.servicePriceOptionLabel?.trim();
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
                  {optionLabel ? (
                    <p className="mt-0 text-xs leading-snug text-zinc-500">
                      {optionLabel}
                    </p>
                  ) : null}
                </div>
                {vehicleLine ? (
                  <p className="mt-2 text-sm text-zinc-400">{vehicleLine}</p>
                ) : null}
                {petLine ? (
                  <p className="mt-2 text-sm text-zinc-400">{petLine}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="tabular-nums text-zinc-300">
                  {formatCatalogPriceCents(job.servicePriceCents)}
                </p>
                {canRemoveJob && onRemoveJob ? (
                  <button
                    type="button"
                    className="cursor-pointer text-xs text-red-400 hover:text-red-300"
                    onClick={() => onRemoveJob(job.localId)}
                  >
                    {removeText}
                  </button>
                ) : null}
              </div>
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

      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full"
      >
        <div className="space-y-2">
          {showSalePricing ? (
            <>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-400">{ui.common.subtotal}</span>
                <span className="tabular-nums text-zinc-300">
                  {formatCatalogPriceCents(saleSubtotalCents!)}
                </span>
              </div>
              {saleDiscountCents != null && saleDiscountCents > 0 ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 text-zinc-400 [overflow-wrap:anywhere]">
                    {saleAppliesLine ?? ui.common.youSave('')}
                  </span>
                  <span className="shrink-0 tabular-nums text-emerald-400">
                    −{formatCatalogPriceCents(saleDiscountCents)}
                  </span>
                </div>
              ) : null}
              <div className="h-px bg-white/10" aria-hidden />
            </>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">
              {jobs.length > 1 ? ui.common.visitTotal : ui.common.total}
            </p>
            <p className="text-lg font-semibold tabular-nums text-white">
              {formatCatalogPriceCents(visitTotalCents)}
            </p>
          </div>
          {saleAppliesLine && !showSalePricing ? (
            <div className="pt-1">
              <BookingSaleAppliesNotice line={saleAppliesLine} />
            </div>
          ) : null}
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
            <p className="text-sm text-zinc-500">{ui.common.schedule}</p>
            <p className="mt-1 text-white">{dateFormatted}</p>
            <p className="mt-0.5 text-zinc-400">
              {timeDisplay}
              {visitDuration > 0
                ? ` · ${formatDurationMinutes(visitDuration, bookingFlowLocale)}`
                : ''}
            </p>
          </div>
          <div className="h-px bg-white/10" aria-hidden />
          <div>
            <p className="text-sm text-zinc-500">{ui.common.customer}</p>
            <p className="mt-1 font-medium text-white">
              {customer.fullName.trim() || '—'}
            </p>
            {customer.phone.trim() ? (
              <p className="mt-0.5 text-zinc-400">{phone}</p>
            ) : null}
            {email ? (
              <p className="mt-0.5 text-zinc-400">{email}</p>
            ) : (
              <p className="mt-0.5 text-zinc-500">
                {ui.common.emailNotProvided}
              </p>
            )}
          </div>
          {showAddress ? (
            <>
              <div className="h-px bg-white/10" aria-hidden />
              <div>
                <p className="text-sm text-zinc-500">{addressLabel}</p>
                <div className="mt-1 space-y-0.5 text-zinc-300">
                  {addressLines.map(line => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          {notes ? (
            <>
              <div className="h-px bg-white/10" aria-hidden />
              <div>
                <p className="text-sm text-zinc-500">{ui.common.notes}</p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-300">
                  {notes}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </GlassCard>

      {canAddAnotherJob && onAddAnotherJob ? (
        <AddAnotherJobCard label={addAnotherLabel} onPress={onAddAnotherJob} />
      ) : null}
    </div>
  );
}
