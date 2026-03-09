'use client';

import { Button } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import { AddOnSelector } from './AddOnSelector';
import { ServiceDetailsBookingSummary } from './ServiceDetailsBookingSummary';
import { getMockAddOnsForService, getMockServiceForId } from './mockData';
import type { ServiceAddOn } from './types';

interface ServiceDetailsScreenProps {
  businessSlug: string;
  serviceId: string;
  /** Restore add-on selections when returning from calendar (from URL). */
  initialAddOnIds?: string[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function ServiceDetailsScreen({
  businessSlug,
  serviceId,
  initialAddOnIds,
}: ServiceDetailsScreenProps) {
  const service = getMockServiceForId(serviceId);
  const addOns = getMockAddOnsForService(serviceId);

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialAddOnIds ?? [])
  );

  const selectedAddOns: ServiceAddOn[] = useMemo(
    () => addOns.filter(a => selectedAddOnIds.has(a.id)),
    [addOns, selectedAddOnIds]
  );

  const totalCents = useMemo(
    () =>
      service.priceCents +
      selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0),
    [service.priceCents, selectedAddOns]
  );

  const handleToggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const searchParams = new URLSearchParams();
  searchParams.set('serviceId', serviceId);
  if (selectedAddOnIds.size > 0) {
    searchParams.set('addOnIds', Array.from(selectedAddOnIds).join(','));
  }
  const calendarUrl = `/${businessSlug}/book?${searchParams.toString()}`;

  return (
    <div className="flex flex-col min-h-[60vh]">
      <div className="flex-1 pb-28">
        {/* Service info */}
        <section className="mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight mb-1">
            {service.name}
          </h1>
          <p className="text-sm text-zinc-400 mb-2">
            {formatPrice(service.priceCents)} ·{' '}
            {formatDurationMinutes(service.durationMinutes)}
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            {service.description}
          </p>
        </section>

        {/* Optional add-ons */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-white mb-3">
            Optional add-ons
          </h2>
          <AddOnSelector
            addOns={addOns}
            selectedIds={selectedAddOnIds}
            onToggle={handleToggleAddOn}
          />
        </section>

        {/* Booking summary */}
        <section className="mb-8">
          <ServiceDetailsBookingSummary
            serviceName={service.name}
            servicePriceCents={service.priceCents}
            selectedAddOns={selectedAddOns}
            totalCents={totalCents}
          />
        </section>
      </div>

      {/* Sticky bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm p-4 safe-area-pb"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          <Button
            href={calendarUrl}
            variant="inverse"
            size="lg"
            fullWidth
            className="font-semibold"
            icon={<ChevronRightIcon className="h-5 w-5" />}
            iconPosition="right"
          >
            Continue to Date & Time
          </Button>
        </div>
      </div>
    </div>
  );
}
