import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';

/** Skip pricing when there is at most one selectable tier. */
export function isCatalogPricingSkipped(
  service: QuoteCatalogService | null | undefined
): boolean {
  if (!service) return true;
  if (!service.priceOptionsEnabled) return true;
  return service.priceOptions.length <= 1;
}

export function isCatalogAddonsSkipped(
  service: QuoteCatalogService | null | undefined
): boolean {
  if (!service) return true;
  return service.addOns.length === 0;
}

/** Display price on the list card (lowest tier when multi-price). */
export function catalogServiceListPriceCents(
  service: QuoteCatalogService
): number {
  if (service.priceOptionsEnabled && service.priceOptions.length > 0) {
    return Math.min(...service.priceOptions.map(o => o.priceCents));
  }
  return service.priceCents;
}

export function formatCatalogPriceCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
