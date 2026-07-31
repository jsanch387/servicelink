import { describe, expect, it } from 'vitest';
import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import {
  catalogServiceListPriceCents,
  isCatalogAddonsSkipped,
  isCatalogPricingSkipped,
} from '@/features/availability/booking/create-appointment/utils/catalogServiceHelpers';

function baseService(
  overrides: Partial<QuoteCatalogService> = {}
): QuoteCatalogService {
  return {
    id: 's1',
    name: 'Detail',
    description: null,
    priceCents: 15000,
    durationMinutes: 60,
    categoryId: null,
    priceOptionsEnabled: false,
    priceOptions: [],
    addOns: [],
    ...overrides,
  };
}

describe('catalogServiceHelpers', () => {
  it('skips pricing when no multi-tier options', () => {
    expect(isCatalogPricingSkipped(baseService())).toBe(true);
    expect(
      isCatalogPricingSkipped(
        baseService({
          priceOptionsEnabled: true,
          priceOptions: [
            { id: 'a', label: 'Sedan', priceCents: 10000, durationMinutes: 60 },
          ],
        })
      )
    ).toBe(true);
  });

  it('requires pricing when 2+ tiers', () => {
    expect(
      isCatalogPricingSkipped(
        baseService({
          priceOptionsEnabled: true,
          priceOptions: [
            { id: 'a', label: 'Sedan', priceCents: 10000, durationMinutes: 60 },
            { id: 'b', label: 'SUV', priceCents: 15000, durationMinutes: 90 },
          ],
        })
      )
    ).toBe(false);
  });

  it('skips add-ons when empty', () => {
    expect(isCatalogAddonsSkipped(baseService())).toBe(true);
    expect(
      isCatalogAddonsSkipped(
        baseService({
          addOns: [
            { id: 'x', name: 'Wax', priceCents: 2000, durationMinutes: 15 },
          ],
        })
      )
    ).toBe(false);
  });

  it('list price uses lowest tier when multi-price', () => {
    expect(
      catalogServiceListPriceCents(
        baseService({
          priceCents: 20000,
          priceOptionsEnabled: true,
          priceOptions: [
            { id: 'a', label: 'Sedan', priceCents: 10000, durationMinutes: 60 },
            { id: 'b', label: 'SUV', priceCents: 15000, durationMinutes: 90 },
          ],
        })
      )
    ).toBe(10000);
  });
});
