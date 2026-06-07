import { getCategoryNameById } from '../getCategoryNameById';
import { describe, expect, it } from 'vitest';

describe('getCategoryNameById', () => {
  const categories = [
    {
      id: 'cat-a',
      business_id: 'biz',
      name: 'Cars',
      sort_order: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('returns the category name when the id exists', () => {
    expect(getCategoryNameById(categories, 'cat-a')).toBe('Cars');
  });

  it('returns null for missing, null, or undefined ids', () => {
    expect(getCategoryNameById(categories, 'missing')).toBeNull();
    expect(getCategoryNameById(categories, null)).toBeNull();
    expect(getCategoryNameById(categories, undefined)).toBeNull();
  });
});
