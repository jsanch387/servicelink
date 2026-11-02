'use client';

import { formatSalesTaxRateLabel } from '@/features/payments/utils/salesTaxRate';
import type {
  AvailabilityBookingDisplay,
  AvailabilityBookingJobDisplay,
} from './types';
import { bookingServiceNameParts } from './utils/bookingCardServiceTitle';

function formatDollars(cents: number): string {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

function JobBlock({
  job,
  showDivider,
}: {
  job: AvailabilityBookingJobDisplay;
  showDivider: boolean;
}) {
  const meta = job.vehicleLabel?.trim() || null;

  return (
    <div
      className={
        showDivider ? 'border-b border-white/[0.06] px-4 py-4' : 'px-4 py-4'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-white [overflow-wrap:anywhere]">
            {job.serviceName}
          </p>
          {job.servicePriceOptionLabel ? (
            <p className="mt-0.5 text-sm text-gray-400">
              {job.servicePriceOptionLabel}
            </p>
          ) : null}
          {meta ? <p className="mt-1.5 text-sm text-gray-500">{meta}</p> : null}
        </div>
        <p className="shrink-0 tabular-nums text-gray-200">
          {formatDollars(job.servicePriceCents)}
        </p>
      </div>

      {job.selectedAddOns.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-gray-400">
          {job.selectedAddOns.map(a => (
            <li
              key={`${a.id}-${a.name}`}
              className="flex items-start justify-between gap-3"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{a.name}</span>
              <span className="shrink-0 tabular-nums text-gray-200">
                +{formatDollars(a.priceCents)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PricingTotals({
  priceLineTotal,
  discount,
  showBookingDiscount,
  priceEstimatedTotal,
  taxCents = 0,
  taxRateBps = 0,
}: {
  priceLineTotal: number;
  discount: AvailabilityBookingDisplay['discount'];
  showBookingDiscount: boolean;
  priceEstimatedTotal: number;
  taxCents?: number;
  taxRateBps?: number;
}) {
  const showTax = taxCents > 0;
  const totalCents = priceEstimatedTotal + (showTax ? taxCents : 0);
  const taxRateLabel = formatSalesTaxRateLabel(taxRateBps);
  const taxLabel = taxRateLabel ? `Tax (${taxRateLabel})` : 'Tax';

  return (
    <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="space-y-1.5 text-sm">
        {showBookingDiscount && discount ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-amber-200/90">{discount.label}</span>
            <span className="shrink-0 tabular-nums text-amber-200/90">
              −{formatDollars(discount.discountCents)}
            </span>
          </div>
        ) : null}
        {showTax ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-gray-400">{taxLabel}</span>
            <span className="shrink-0 tabular-nums text-gray-300">
              {formatDollars(taxCents)}
            </span>
          </div>
        ) : null}
        <div
          className={`flex items-baseline justify-between gap-3 ${
            showBookingDiscount || showTax
              ? 'mt-2 border-t border-white/[0.06] pt-2'
              : ''
          }`}
        >
          <span className="font-medium text-white">Total</span>
          {showBookingDiscount ? (
            <div className="flex items-baseline gap-2">
              <span className="text-sm tabular-nums text-zinc-500 line-through decoration-zinc-500/70">
                {formatDollars(priceLineTotal)}
              </span>
              <span className="font-semibold tabular-nums text-white">
                {formatDollars(totalCents)}
              </span>
            </div>
          ) : (
            <span className="font-semibold tabular-nums text-white">
              {formatDollars(totalCents)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export interface BookingDetailServiceSectionProps {
  booking: AvailabilityBookingDisplay;
}

/**
 * Service + pricing for booking details.
 * Uses per-job line items when `job_details` was mapped onto `booking.jobs`.
 */
export function BookingDetailServiceSection({
  booking,
}: BookingDetailServiceSectionProps) {
  const jobs = booking.jobs ?? [];
  const bookingDiscount = booking.discount;
  const taxCents =
    typeof booking.payment?.taxCents === 'number' &&
    booking.payment.taxCents > 0
      ? booking.payment.taxCents
      : 0;
  const taxRateBps =
    taxCents > 0 && typeof booking.payment?.taxRateBps === 'number'
      ? booking.payment.taxRateBps
      : 0;

  if (jobs.length > 0) {
    const priceLineTotal = jobs.reduce(
      (sum, job) =>
        sum +
        job.servicePriceCents +
        job.selectedAddOns.reduce((s, a) => s + a.priceCents, 0),
      0
    );
    const showBookingDiscount =
      bookingDiscount != null &&
      bookingDiscount.discountCents > 0 &&
      bookingDiscount.discountCents < priceLineTotal;
    const priceEstimatedTotal = showBookingDiscount
      ? Math.max(0, priceLineTotal - bookingDiscount.discountCents)
      : priceLineTotal;

    return (
      <section>
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
          {jobs.length > 1 ? 'Services' : 'Service'}
        </h3>
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
          {jobs.map((job, index) => (
            <JobBlock
              key={`${job.serviceName}-${index}`}
              job={job}
              showDivider={index < jobs.length - 1}
            />
          ))}
          <PricingTotals
            priceLineTotal={priceLineTotal}
            discount={bookingDiscount}
            showBookingDiscount={showBookingDiscount}
            priceEstimatedTotal={priceEstimatedTotal}
            taxCents={taxCents}
            taxRateBps={taxRateBps}
          />
        </div>
      </section>
    );
  }

  const { name: serviceBaseName, optionLabel: serviceOptionLabel } =
    bookingServiceNameParts(booking.serviceName);
  const priceLineTotal =
    (booking.servicePriceCents ?? 0) +
    (booking.addonDetails ?? []).reduce((s, a) => s + a.priceCents, 0);
  const showBookingDiscount =
    bookingDiscount != null &&
    bookingDiscount.discountCents > 0 &&
    bookingDiscount.discountCents < priceLineTotal;
  const priceEstimatedTotal = showBookingDiscount
    ? Math.max(0, priceLineTotal - bookingDiscount.discountCents)
    : priceLineTotal;
  const showPriceBreakdown =
    booking.servicePriceCents != null ||
    (booking.addonDetails?.length ?? 0) > 0;

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
        Service
      </h3>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <div className="p-4">
          <p className="font-semibold leading-snug text-white">
            {serviceBaseName}
          </p>
          {serviceOptionLabel ? (
            <p className="mt-0.5 text-sm text-gray-400">{serviceOptionLabel}</p>
          ) : null}
        </div>

        {showPriceBreakdown ? (
          <>
            {booking.servicePriceCents != null ||
            (booking.addonDetails?.length ?? 0) > 0 ? (
              <div className="space-y-1.5 border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm">
                {booking.servicePriceCents != null ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-gray-300">Service</span>
                    <span className="tabular-nums text-gray-200">
                      {formatDollars(booking.servicePriceCents)}
                    </span>
                  </div>
                ) : null}
                {booking.addonDetails?.map(a => (
                  <div
                    key={a.id}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="text-gray-300">{a.name}</span>
                    <span className="tabular-nums text-gray-200">
                      +{formatDollars(a.priceCents)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <PricingTotals
              priceLineTotal={priceLineTotal}
              discount={bookingDiscount}
              showBookingDiscount={showBookingDiscount}
              priceEstimatedTotal={priceEstimatedTotal}
              taxCents={taxCents}
              taxRateBps={taxRateBps}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
