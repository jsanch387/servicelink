import { describe, expect, it } from 'vitest';
import {
  resolvePreviewSlug,
  slugFromBusinessName,
  suggestFreeSlug,
} from '../slugPreview';

describe('slugFromBusinessName', () => {
  it('drops spaces and punctuation', () => {
    expect(slugFromBusinessName("Mike's Detailing")).toBe('mikesdetailing');
  });

  it('returns empty for a blank name', () => {
    expect(slugFromBusinessName('   ')).toBe('');
  });
});

describe('resolvePreviewSlug', () => {
  it('marks a known slug as taken and offers the next free one', () => {
    expect(resolvePreviewSlug('detailing')).toEqual({
      state: 'taken',
      typed: 'detailing',
      suggestion: 'detailing2',
    });
  });

  it('marks a fresh slug as free', () => {
    expect(resolvePreviewSlug('mikesdetailing')).toEqual({
      state: 'free',
      slug: 'mikesdetailing',
    });
  });

  it('stays idle until there are 3 characters', () => {
    expect(resolvePreviewSlug('ab')).toEqual({ state: 'idle' });
  });
});

describe('suggestFreeSlug', () => {
  it('appends the next free number', () => {
    expect(suggestFreeSlug('mike')).toBe('mike2');
  });
});
