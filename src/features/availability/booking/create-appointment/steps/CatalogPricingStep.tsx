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
    <PriceOptionSelector
      options={service.priceOptions}
      selectedId={selectedOptionId}
      onSelect={onSelect}
    />
  );
}
