'use client';

import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { PriceOptionSelector } from '@/features/services/booking-flow';
import React from 'react';

export interface CatalogPricingStepProps {
  service: QuoteCatalogService;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}

export function CatalogPricingStep({
  service,
  selectedOptionId,
  onSelect,
}: CatalogPricingStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Choose a price for{' '}
        <span className="font-medium text-zinc-200">{service.name}</span>.
      </p>
      <PriceOptionSelector
        options={service.priceOptions}
        selectedId={selectedOptionId}
        onSelect={onSelect}
      />
    </div>
  );
}
