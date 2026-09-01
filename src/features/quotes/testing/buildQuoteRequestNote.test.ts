import { describe, expect, it } from 'vitest';
import {
  buildQuoteRequestNote,
  quoteRequestServiceNameFromAsk,
} from '@/features/quotes/public-request/buildQuoteRequestNote';

describe('buildQuoteRequestNote', () => {
  it('writes timing and second vehicle as headers', () => {
    expect(
      buildQuoteRequestNote(
        'Coffee on the seats.',
        'This week',
        '2018 Honda Civic'
      )
    ).toBe(
      'Preferred timing: This week\nSecond vehicle: 2018 Honda Civic\n\nCoffee on the seats.'
    );
  });

  it('returns the ask alone when there are no headers', () => {
    expect(buildQuoteRequestNote('Just wash it.', null)).toBe('Just wash it.');
  });
});

describe('quoteRequestServiceNameFromAsk', () => {
  it('uses the ask as the inbox title', () => {
    expect(quoteRequestServiceNameFromAsk('Coffee on the seats.')).toBe(
      'Coffee on the seats.'
    );
  });
});
