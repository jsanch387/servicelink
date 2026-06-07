import { describe, expect, it } from 'vitest';
import type { ServiceCategoryRow } from '../types/serviceCategories';
import type { ServiceRow } from '@/features/services/types/services';
import {
  applyBucketSortOrder,
  sortOrderForBucketIndex,
  sortServicesForDisplay,
  sortServicesWithinBucket,
} from '../utils/sortServicesForDisplay';

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

function category(
  overrides: Partial<ServiceCategoryRow> &
    Pick<ServiceCategoryRow, 'id' | 'name'>
): ServiceCategoryRow {
  return {
    business_id: 'biz',
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as ServiceCategoryRow;
}

describe('sortOrderForBucketIndex', () => {
  it('uses index * 10', () => {
    expect(sortOrderForBucketIndex(0)).toBe(0);
    expect(sortOrderForBucketIndex(1)).toBe(10);
    expect(sortOrderForBucketIndex(3)).toBe(30);
  });
});

describe('sortServicesWithinBucket', () => {
  it('sorts by sort_order, then created_at, then name', () => {
    const sorted = sortServicesWithinBucket([
      service({
        id: 'b',
        name: 'B',
        sort_order: 10,
        created_at: '2026-01-02T00:00:00.000Z',
      }),
      service({
        id: 'a',
        name: 'A',
        sort_order: 0,
        created_at: '2026-01-03T00:00:00.000Z',
      }),
      service({
        id: 'c',
        name: 'C',
        sort_order: null,
        created_at: '2026-01-04T00:00:00.000Z',
      }),
    ]);

    expect(sorted.map(s => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('allows the same sort_order in different buckets', () => {
    const catA = sortServicesWithinBucket([
      service({ id: 'a1', name: 'A1', category_id: 'cat-a', sort_order: 0 }),
      service({ id: 'a2', name: 'A2', category_id: 'cat-a', sort_order: 10 }),
    ]);
    const catB = sortServicesWithinBucket([
      service({ id: 'b1', name: 'B1', category_id: 'cat-b', sort_order: 0 }),
    ]);

    expect(catA[0].sort_order).toBe(0);
    expect(catB[0].sort_order).toBe(0);
  });
});

describe('sortServicesForDisplay', () => {
  const categories = [
    category({ id: 'cat-cars', name: 'Cars', sort_order: 0 }),
    category({ id: 'cat-boats', name: 'Boats', sort_order: 10 }),
  ];

  it('orders category sections then within-bucket sort', () => {
    const services = [
      service({
        id: 'boat-2',
        name: 'Boat 2',
        category_id: 'cat-boats',
        sort_order: 10,
      }),
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
      service({ id: 'uncat', name: 'Uncat', category_id: null, sort_order: 0 }),
    ];

    expect(sortServicesForDisplay(services, categories).map(s => s.id)).toEqual(
      ['car-1', 'car-2', 'boat-1', 'boat-2', 'uncat']
    );
  });

  it('uses flat bucket sort when there are no categories', () => {
    const services = [
      service({ id: 'b', name: 'B', sort_order: 10 }),
      service({ id: 'a', name: 'A', sort_order: 0 }),
    ];

    expect(sortServicesForDisplay(services, []).map(s => s.id)).toEqual([
      'a',
      'b',
    ]);
  });
});

describe('applyBucketSortOrder', () => {
  it('sets sort_order to index * 10 for reordered ids only', () => {
    const services = [
      service({ id: 'a', name: 'A', sort_order: 0 }),
      service({ id: 'b', name: 'B', sort_order: 10 }),
      service({ id: 'c', name: 'C', sort_order: 0, category_id: 'other' }),
    ];

    const updated = applyBucketSortOrder(services, ['b', 'a']);

    expect(updated.find(s => s.id === 'a')?.sort_order).toBe(10);
    expect(updated.find(s => s.id === 'b')?.sort_order).toBe(0);
    expect(updated.find(s => s.id === 'c')?.sort_order).toBe(0);
  });
});
