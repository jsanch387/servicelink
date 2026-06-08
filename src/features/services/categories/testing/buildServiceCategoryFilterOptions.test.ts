import { describe, expect, it } from 'vitest';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '../types/serviceCategories';
import { buildServiceCategoryFilterOptions } from '../utils/buildServiceCategoryFilterOptions';

describe('buildServiceCategoryFilterOptions', () => {
  const categories = [
    {
      id: 'cat-b',
      business_id: 'biz',
      name: 'Boats',
      sort_order: 10,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'cat-a',
      business_id: 'biz',
      name: 'Cars',
      sort_order: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  const services = [
    {
      id: 's1',
      business_id: 'biz',
      name: 'Wash',
      description: null,
      price_cents: 1000,
      hours_to_complete: null,
      duration_minutes: 60,
      price_options_enabled: false,
      is_active: true,
      sort_order: 0,
      category_id: 'cat-a',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 's2',
      business_id: 'biz',
      name: 'Detail',
      description: null,
      price_cents: 2000,
      hours_to_complete: null,
      duration_minutes: 90,
      price_options_enabled: false,
      is_active: true,
      sort_order: 1,
      category_id: 'cat-a',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 's3',
      business_id: 'biz',
      name: 'Hull',
      description: null,
      price_cents: 3000,
      hours_to_complete: null,
      duration_minutes: 120,
      price_options_enabled: false,
      is_active: true,
      sort_order: 2,
      category_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('includes category name with count and No category when uncategorized services exist', () => {
    const options = buildServiceCategoryFilterOptions(categories, services);

    expect(options).toEqual([
      { id: 'cat-a', label: 'Cars 2' },
      { id: 'cat-b', label: 'Boats 0' },
      { id: SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID, label: 'No category 1' },
    ]);
  });

  it('omits No category when all services are categorized', () => {
    const categorizedOnly = services.filter(
      service => service.category_id != null
    );
    const options = buildServiceCategoryFilterOptions(
      categories,
      categorizedOnly
    );

    expect(options).toEqual([
      { id: 'cat-a', label: 'Cars 2' },
      { id: 'cat-b', label: 'Boats 0' },
    ]);
  });
});
