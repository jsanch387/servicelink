'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { ServiceAddOn } from './types';

interface ServiceDetailsBookingSummaryProps {
  serviceName: string;
  servicePriceCents: number;
  serviceDurationMinutes: number;
  /** Shown under the service name (e.g. selected vehicle / tier). */
  selectedVariantLabel?: string;
  selectedAddOns: ServiceAddOn[];
  totalCents: number;
  serviceLabel: string;
  addOnsLabel: string;
  totalLabel: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function ServiceDetailsBookingSummary({
  serviceName,
  servicePriceCents,
  serviceDurationMinutes,
  selectedVariantLabel,
  selectedAddOns,
  totalCents,
  serviceLabel,
  addOnsLabel,
  totalLabel,
  bookingFlowLocale = 'en',
}: ServiceDetailsBookingSummaryProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {serviceLabel}
          </p>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white [overflow-wrap:anywhere]">
                {serviceName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-400">
                {selectedVariantLabel ? (
                  <>
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {selectedVariantLabel}
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">
                      &bull;
                    </span>
                  </>
                ) : null}
                <span>
                  {formatDurationMinutes(
                    serviceDurationMinutes,
                    bookingFlowLocale
                  )}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
              {formatPrice(servicePriceCents)}
            </span>
          </div>
        </div>

        {selectedAddOns.length > 0 ? (
          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              {addOnsLabel}
            </p>
            <div className="space-y-2.5">
              {selectedAddOns.map(addOn => (
                <div
                  key={addOn.id}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-white">
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {addOn.name}
                    </span>
                    {addOn.durationMinutes != null &&
                    addOn.durationMinutes > 0 ? (
                      <>
                        <span aria-hidden="true" className="text-zinc-600">
                          &bull;
                        </span>
                        <span className="text-xs text-zinc-400">
                          +
                          {formatDurationMinutes(
                            addOn.durationMinutes,
                            bookingFlowLocale
                          )}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <span className="shrink-0 tabular-nums text-zinc-200">
                    +{formatPrice(addOn.priceCents)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-4 border-t border-white/10 bg-white/[0.035] px-4 py-3.5 text-base font-semibold text-white">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{formatPrice(totalCents)}</span>
      </div>
    </div>
  );
}
