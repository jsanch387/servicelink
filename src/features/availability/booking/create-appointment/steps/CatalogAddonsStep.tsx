'use client';

import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { AddOnSelector } from '@/features/services/booking-flow';
import React, { useMemo } from 'react';

export interface CatalogAddonsStepProps {
  service: QuoteCatalogService;
  selectedAddonIds: string[];
  onToggle: (addonId: string) => void;
}

export function CatalogAddonsStep({
  service,
  selectedAddonIds,
  onToggle,
}: CatalogAddonsStepProps) {
  const selectedIds = useMemo(
    () => new Set(selectedAddonIds),
    [selectedAddonIds]
  );

  return (
    <AddOnSelector
      addOns={service.addOns}
      selectedIds={selectedIds}
      onToggle={onToggle}
    />
  );
}
