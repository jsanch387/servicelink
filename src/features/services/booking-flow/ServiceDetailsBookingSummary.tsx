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
  addOnsLabel,
  totalLabel,
  bookingFlowLocale = 'en',
}: ServiceDetailsBookingSummaryProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
      <div>
        <div className="flex justify-between items-baseline text-sm gap-3">
          <span className="text-white font-semibold min-w-0">
            {serviceName}
            {selectedVariantLabel ? (
              <span className="block text-zinc-400 font-normal text-xs mt-1">
                {selectedVariantLabel}
              </span>
            ) : null}
            <span className="mt-1 block text-xs font-normal text-zinc-500">
              {formatDurationMinutes(serviceDurationMinutes, bookingFlowLocale)}
            </span>
          </span>
          <span className="text-white font-semibold tabular-nums shrink-0">
            {formatPrice(servicePriceCents)}
          </span>
        </div>
      </div>
      {selectedAddOns.length > 0 && (
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
            {addOnsLabel}
          </p>
          <div className="space-y-1">
            {selectedAddOns.map(a => (
              <div
                key={a.id}
                className="flex justify-between items-baseline text-sm text-white gap-2"
              >
                <span className="min-w-0">
                  {a.name}
                  {a.durationMinutes != null && a.durationMinutes > 0 ? (
                    <span className="text-zinc-500 block text-xs mt-0.5 font-normal">
                      +{' '}
                      {formatDurationMinutes(
                        a.durationMinutes,
                        bookingFlowLocale
                      )}
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums shrink-0">
                  + {formatPrice(a.priceCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between items-baseline text-base font-semibold text-white pt-2 border-t border-white/10">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{formatPrice(totalCents)}</span>
      </div>
    </div>
  );
}
