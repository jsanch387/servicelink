import { describe, expect, it } from 'vitest';
import type { ServiceRow } from '@/features/services/types/services';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '../types/serviceCategories';
import { filterServicesByCategoryFilter } from '../utils/filterServicesByCategoryFilter';

function service(
  overrides: Partial<ServiceRow> & Pick<ServiceRow, 'id' | 'name'>
): ServiceRow {
  return {
    business_id: 'biz',
    description: null,
    price_cents: 1000,
    hours_to_complete: null,
    duration_minutes: 60,
    price_options_enabled: false,
    is_active: true,
    category_id: null,
    sort_order: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as ServiceRow;
}

describe('filterServicesByCategoryFilter', () => {
  const services = [
    service({
      id: 'car-2',
      name: 'Car 2',
      category_id: 'cat-cars',
      sort_order: 10,
    }),
    service({
      id: 'boat-1',
      name: 'Boat 1',
      category_id: 'cat-boats',
      sort_order: 0,
    }),
    service({
      id: 'car-1',
      name: 'Car 1',
      category_id: 'cat-cars',
      sort_order: 0,
    }),
    service({
      id: 'uncat',
      name: 'Uncat',
      category_id: null,
      sort_order: 0,
    }),
  ];

  it('returns only services in the selected category, sorted within the bucket', () => {
    expect(
      filterServicesByCategoryFilter(services, 'cat-cars').map(s => s.id)
    ).toEqual(['car-1', 'car-2']);
  });

  it('returns uncategorized services for the No category filter', () => {
    expect(
      filterServicesByCategoryFilter(
        services,
        SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID
      ).map(s => s.id)
    ).toEqual(['uncat']);
  });

  it('returns an empty list when the category bucket has no services', () => {
    expect(filterServicesByCategoryFilter(services, 'cat-empty')).toEqual([]);
  });
});
