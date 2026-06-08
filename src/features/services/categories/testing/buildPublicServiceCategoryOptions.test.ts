import { describe, expect, it } from 'vitest';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '../types/serviceCategories';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '../utils/buildPublicServiceCategoryOptions';

describe('shouldShowPublicServiceCategoryFilters', () => {
  const oneCategory = [
    {
      id: 'cat-a',
      business_id: 'biz',
      name: 'Cars',
      sort_order: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('is false when there are no categories', () => {
    expect(shouldShowPublicServiceCategoryFilters([], [])).toBe(false);
  });

  it('is false when one category holds every service', () => {
    expect(
      shouldShowPublicServiceCategoryFilters(oneCategory, [
        { category_id: 'cat-a' },
        { category_id: 'cat-a' },
      ])
    ).toBe(false);
  });

  it('is true when one category exists and some services are uncategorized', () => {
    expect(
      shouldShowPublicServiceCategoryFilters(oneCategory, [
        { category_id: 'cat-a' },
        { category_id: null },
      ])
    ).toBe(true);
  });

  it('is true when at least two categories exist', () => {
    expect(
      shouldShowPublicServiceCategoryFilters(
        [
          ...oneCategory,
          {
            id: 'cat-b',
            business_id: 'biz',
            name: 'Boats',
            sort_order: 10,
            created_at: '2026-01-02T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
        ],
        [{ category_id: 'cat-a' }]
      )
    ).toBe(true);
  });
});

describe('buildPublicServiceCategoryOptions', () => {
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
      category_id: 'cat-a',
    },
    {
      id: 's2',
      business_id: 'biz',
      name: 'Hull',
      category_id: null,
    },
  ] as const;

  it('returns empty when there are no categories', () => {
    expect(
      buildPublicServiceCategoryOptions([], services as never, 'Other')
    ).toEqual([]);
  });

  it('returns sorted category names and an uncategorized tab when needed', () => {
    expect(
      buildPublicServiceCategoryOptions(
        categories,
        services as never,
        'Other services'
      )
    ).toEqual([
      { id: 'cat-a', label: 'Cars' },
      { id: 'cat-b', label: 'Boats' },
      { id: SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID, label: 'Other services' },
    ]);
  });

  it('omits the uncategorized tab when every service is categorized', () => {
    const categorizedOnly = [{ ...services[0] }] as never;

    expect(
      buildPublicServiceCategoryOptions(
        categories,
        categorizedOnly,
        'Other services'
      )
    ).toEqual([
      { id: 'cat-a', label: 'Cars' },
      { id: 'cat-b', label: 'Boats' },
    ]);
  });
});
