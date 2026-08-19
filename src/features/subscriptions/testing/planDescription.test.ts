import { describe, expect, it } from 'vitest';
import {
  normalizePlanDescriptionForStorage,
  planDescriptionForDisplay,
} from '../utils/planDescription';

describe('normalizePlanDescriptionForStorage', () => {
  it('keeps bullets inside description', () => {
    const raw = 'Monthly wash.\n• Interior wipe\n• Tire shine';
    expect(normalizePlanDescriptionForStorage(raw)).toBe(raw);
  });
});

describe('planDescriptionForDisplay', () => {
  it('returns the stored description', () => {
    expect(planDescriptionForDisplay('Monthly wash.\n• Interior wipe')).toBe(
      'Monthly wash.\n• Interior wipe'
    );
  });
});
