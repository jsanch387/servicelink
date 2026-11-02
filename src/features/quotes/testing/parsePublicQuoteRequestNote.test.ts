import { describe, expect, it } from 'vitest';
import { parsePublicQuoteRequestNote } from '@/features/quotes/dashboard/utils/parsePublicQuoteRequestNote';

describe('parsePublicQuoteRequestNote', () => {
  it('splits preferred timing and details', () => {
    const r = parsePublicQuoteRequestNote(
      'Preferred timing: Flexible\n\nInterior shampoo needed.'
    );
    expect(r.preferredTiming).toBe('Flexible');
    expect(r.secondVehicleLine).toBeNull();
    expect(r.detailsOnly).toBe('Interior shampoo needed.');
  });

  it('splits timing, second vehicle, and details', () => {
    const r = parsePublicQuoteRequestNote(
      'Preferred timing: This week\nSecond vehicle: 2018 Honda Civic\n\nCoffee on the seats.'
    );
    expect(r.preferredTiming).toBe('This week');
    expect(r.secondVehicleLine).toBe('2018 Honda Civic');
    expect(r.detailsOnly).toBe('Coffee on the seats.');
  });

  it('returns whole string as details when no prefix', () => {
    const r = parsePublicQuoteRequestNote('Just the details.');
    expect(r.preferredTiming).toBeNull();
    expect(r.secondVehicleLine).toBeNull();
    expect(r.detailsOnly).toBe('Just the details.');
  });

  it('handles empty note', () => {
    expect(parsePublicQuoteRequestNote(null)).toEqual({
      preferredTiming: null,
      secondVehicleLine: null,
      detailsOnly: '',
    });
  });
});
