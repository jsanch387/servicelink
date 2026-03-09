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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Service:</span>
        <span className="text-white font-medium">
          {serviceName} – {formatPrice(servicePriceCents)}
        </span>
      </div>
      {selectedAddOns.length > 0 && (
        <div className="space-y-1">
          <span className="text-zinc-400 text-sm block">Add-ons:</span>
          {selectedAddOns.map(a => (
            <div key={a.id} className="flex justify-between text-sm text-white">
              <span>{a.name}</span>
              <span>{formatPrice(a.priceCents)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-white/10">
        <span>Total:</span>
        <span>{formatPrice(totalCents)}</span>
      </div>
    </div>
  );
}
