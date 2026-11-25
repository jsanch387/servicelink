import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadQuoteServiceCatalogMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: fromMock }),
}));

vi.mock('@/features/quotes/server/loadQuoteServiceCatalog', () => ({
  loadQuoteServiceCatalog: (...args: unknown[]) =>
    loadQuoteServiceCatalogMock(...args),
}));

import { executeGetServiceMenu } from '../tools/read/getServiceMenu';

describe('executeGetServiceMenu', () => {
  beforeEach(() => {
    loadQuoteServiceCatalogMock.mockReset();
    fromMock.mockReset();
    fromMock.mockReturnValue({
      select: () => ({
        eq: async () => ({
          data: [{ id: 'cat-1', name: 'Exterior' }],
          error: null,
        }),
      }),
    });
  });

  it('returns the active menu with category names and description gaps', async () => {
    loadQuoteServiceCatalogMock.mockResolvedValue([
      {
        id: 's1',
        name: 'Full detail',
        description: 'Inside and out wash with vacuum.',
        priceCents: 25000,
        durationMinutes: 180,
        categoryId: 'cat-1',
        priceOptionsEnabled: false,
        priceOptions: [],
        addOns: [{ id: 'a1', name: 'Clay bar', priceCents: 5000 }],
      },
      {
        id: 's2',
        name: 'Express wash',
        description: null,
        priceCents: 8000,
        durationMinutes: 45,
        categoryId: null,
        priceOptionsEnabled: false,
        priceOptions: [],
        addOns: [],
      },
    ]);

    const result = await executeGetServiceMenu({ businessId: 'biz-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.serviceCount).toBe(2);
    expect(result.missingDescriptionCount).toBe(1);
    expect(result.priceRangeLabel).toBe('$80–$250');
    expect(result.services[0]).toMatchObject({
      name: 'Full detail',
      categoryName: 'Exterior',
      hasDescription: true,
      priceLabel: '$250',
      addOnCount: 1,
    });
    expect(result.services[1]?.hasDescription).toBe(false);
  });
});
