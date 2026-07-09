import { describe, expect, it } from 'vitest';
import { getDefaultPlaceholderService } from '../utils/defaultPlaceholderService';

describe('getDefaultPlaceholderService', () => {
  it('returns type-specific defaults for known business types', () => {
    const lawn = getDefaultPlaceholderService('Lawn Care & Landscaping');
    expect(lawn.name).toBe('Lawn Mowing');
    expect(lawn.durationMinutes).toBe(60);
  });

  it('returns generic defaults for unknown or empty business type', () => {
    expect(getDefaultPlaceholderService('Other').name).toBe('Standard Service');
    expect(getDefaultPlaceholderService('').name).toBe('Standard Service');
    expect(getDefaultPlaceholderService(undefined).name).toBe(
      'Standard Service'
    );
  });
});
