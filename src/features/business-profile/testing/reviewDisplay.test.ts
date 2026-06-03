import { describe, expect, it } from 'vitest';
import {
  formatAverageRating,
  roundAverageRating,
} from '../reviews/utils/reviewDisplay';

describe('roundAverageRating', () => {
  it('rounds to one decimal', () => {
    expect(roundAverageRating(4.46)).toBe(4.5);
    expect(roundAverageRating(4.94)).toBe(4.9);
  });
});

describe('formatAverageRating', () => {
  it('always shows one decimal place', () => {
    expect(formatAverageRating(5)).toBe('5.0');
    expect(formatAverageRating(4.5)).toBe('4.5');
    expect(formatAverageRating(4.46)).toBe('4.5');
  });
});
