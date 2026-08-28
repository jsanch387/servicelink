import { describe, expect, it } from 'vitest';

import {
  INTERNAL_ANALYTICS_EMAILS,
  isInternalAnalyticsEmail,
} from '../config/internalAnalyticsAllowlist';

describe('isInternalAnalyticsEmail', () => {
  it('allows the founder list case-insensitively', () => {
    const sample = INTERNAL_ANALYTICS_EMAILS[0];
    expect(sample).toBeTruthy();
    expect(isInternalAnalyticsEmail(sample)).toBe(true);
    expect(isInternalAnalyticsEmail(sample.toUpperCase())).toBe(true);
    expect(isInternalAnalyticsEmail('not-internal@example.com')).toBe(false);
    expect(isInternalAnalyticsEmail(null)).toBe(false);
  });
});
