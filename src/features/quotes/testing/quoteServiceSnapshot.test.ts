import { describe, expect, it } from 'vitest';
import {
  normalizeQuoteAddonDetails,
  splitQuoteServiceDisplayName,
} from '@/features/quotes/shared/quoteServiceSnapshot';

describe('normalizeQuoteAddonDetails', () => {
  it('returns null for empty or invalid input', () => {
    expect(normalizeQuoteAddonDetails(null)).toBeNull();
    expect(normalizeQuoteAddonDetails([])).toBeNull();
    expect(normalizeQuoteAddonDetails('x')).toBeNull();
  });

  it('normalizes camelCase and snake_case price fields', () => {
    expect(
      normalizeQuoteAddonDetails([
        { id: 'a', name: 'Ceramic', priceCents: 5000 },
        { id: 'b', name: 'Pet hair', price_cents: 2500, duration_minutes: 15 },
      ])
    ).toEqual([
      { id: 'a', name: 'Ceramic', priceCents: 5000, durationMinutes: null },
      {
        id: 'b',
        name: 'Pet hair',
        priceCents: 2500,
        durationMinutes: 15,
      },
    ]);
  });
});

describe('splitQuoteServiceDisplayName', () => {
  it('splits Name — Option', () => {
    expect(splitQuoteServiceDisplayName('Full Detail — Sedan')).toEqual({
      title: 'Full Detail',
      optionLabel: 'Sedan',
    });
  });

  it('keeps plain names intact', () => {
    expect(splitQuoteServiceDisplayName('Custom polish')).toEqual({
      title: 'Custom polish',
      optionLabel: null,
    });
  });
});
