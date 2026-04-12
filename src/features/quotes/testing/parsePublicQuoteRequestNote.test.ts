import { describe, expect, it } from 'vitest';
import { parsePublicQuoteRequestNote } from '@/features/quotes/dashboard/utils/parsePublicQuoteRequestNote';

describe('parsePublicQuoteRequestNote', () => {
  it('splits preferred timing and details', () => {
    const r = parsePublicQuoteRequestNote(
      'Preferred timing: Flexible\n\nInterior shampoo needed.'
    );
    expect(r.preferredTiming).toBe('Flexible');
    expect(r.detailsOnly).toBe('Interior shampoo needed.');
  });

  it('returns whole string as details when no prefix', () => {
    const r = parsePublicQuoteRequestNote('Just the details.');
    expect(r.preferredTiming).toBeNull();
    expect(r.detailsOnly).toBe('Just the details.');
  });

  it('handles empty note', () => {
    expect(parsePublicQuoteRequestNote(null)).toEqual({
      preferredTiming: null,
      detailsOnly: '',
    });
  });
});
