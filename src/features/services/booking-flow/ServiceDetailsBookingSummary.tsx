'use client';

import type { ServiceAddOn } from './types';

interface ServiceDetailsBookingSummaryProps {
  serviceName: string;
  servicePriceCents: number;
  selectedAddOns: ServiceAddOn[];
  totalCents: number;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function ServiceDetailsBookingSummary({
  serviceName,
  servicePriceCents,
  selectedAddOns,
  totalCents,
}: ServiceDetailsBookingSummaryProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
      <div>
        <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
          Service
        </p>
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-white font-semibold">{serviceName}</span>
          <span className="text-white font-semibold tabular-nums">
            {formatPrice(servicePriceCents)}
          </span>
        </div>
      </div>
      {selectedAddOns.length > 0 && (
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
            Add-ons
          </p>
          <div className="space-y-1">
            {selectedAddOns.map(a => (
              <div
                key={a.id}
                className="flex justify-between items-baseline text-sm text-white"
              >
                <span>{a.name}</span>
                <span className="tabular-nums">
                  +{formatPrice(a.priceCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between items-baseline text-base font-semibold text-white pt-2 border-t border-white/10">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(totalCents)}</span>
      </div>
    </div>
  );
}
