import { describe, expect, it } from 'vitest';
import {
  formatPaymentLinkAmount,
  truncatePaymentLinkNote,
} from '../formatPaymentLinkAmount';

describe('formatPaymentLinkAmount', () => {
  it('formats cents as USD', () => {
    expect(formatPaymentLinkAmount(4000)).toBe('$40.00');
    expect(formatPaymentLinkAmount(50)).toBe('$0.50');
  });
});

describe('truncatePaymentLinkNote', () => {
  it('keeps short notes intact', () => {
    expect(truncatePaymentLinkNote('Exterior Wash')).toBe('Exterior Wash');
  });

  it('truncates long notes with an ellipsis', () => {
    const note =
      'A very long description of extra work that should not overflow';
    const out = truncatePaymentLinkNote(note, 20);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(20);
  });
});
