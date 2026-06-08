import { describe, expect, it } from 'vitest';
import { shouldShowServiceCategoryFilters } from '../utils/shouldShowServiceCategoryFilters';

describe('shouldShowServiceCategoryFilters', () => {
  it('returns false when there are no categories', () => {
    expect(shouldShowServiceCategoryFilters([], [{ category_id: null }])).toBe(
      false
    );
  });

  it('returns true when there are two or more categories', () => {
    expect(
      shouldShowServiceCategoryFilters(
        [{ id: 'a' }, { id: 'b' }],
        [{ category_id: 'a' }, { category_id: 'a' }]
      )
    ).toBe(true);
  });

  it('returns false for one category when all services are assigned', () => {
    expect(
      shouldShowServiceCategoryFilters(
        [{ id: 'a' }],
        [{ category_id: 'a' }, { category_id: 'a' }]
      )
    ).toBe(false);
  });

  it('returns true for one category when some services are uncategorized', () => {
    expect(
      shouldShowServiceCategoryFilters(
        [{ id: 'a' }],
        [{ category_id: 'a' }, { category_id: null }]
      )
    ).toBe(true);
  });
});
