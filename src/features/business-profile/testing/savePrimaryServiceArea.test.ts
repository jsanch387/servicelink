import { savePrimaryServiceArea } from '../api/savePrimaryServiceArea';
import { afterEach, describe, expect, it, vi } from 'vitest';

const payload = {
  label: 'San Juan, PR',
  city: 'San Juan',
  stateCode: 'PR',
  latitude: 18.4653,
  longitude: -66.1167,
  radiusMiles: 25,
};

describe('savePrimaryServiceArea', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns a reachable error when fetch cannot connect', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );

    const result = await savePrimaryServiceArea(payload);

    expect(result).toEqual({
      success: false,
      error:
        'Could not reach the server. Make sure the app is running and try again.',
    });
  });

  it('keeps the API error when the request completes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Choose a suggested city and state.',
        }),
      })
    );

    const result = await savePrimaryServiceArea(payload);

    expect(result).toEqual({
      success: false,
      error: 'Choose a suggested city and state.',
    });
  });
});
