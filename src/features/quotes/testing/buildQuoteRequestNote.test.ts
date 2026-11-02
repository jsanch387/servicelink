import { describe, expect, it } from 'vitest';
import {
  buildQuoteRequestNote,
  quoteRequestServiceNameFromAsk,
} from '@/features/quotes/public-request/buildQuoteRequestNote';

describe('buildQuoteRequestNote', () => {
  it('writes timing as a header and leaves vehicles out of the note', () => {
    expect(buildQuoteRequestNote('Coffee on the seats.', 'This week')).toBe(
      'Preferred timing: This week\n\nCoffee on the seats.'
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
