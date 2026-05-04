import { describe, expect, it } from 'vitest';
import { splitStoredAvailabilityServiceName } from '../splitStoredAvailabilityServiceName';

describe('splitStoredAvailabilityServiceName', () => {
  it('returns base only when no option separator', () => {
    expect(splitStoredAvailabilityServiceName('Full detail')).toEqual({
      serviceName: 'Full detail',
    });
  });

  it('splits on em dash option label', () => {
    expect(splitStoredAvailabilityServiceName('Wash — SUV')).toEqual({
      serviceName: 'Wash',
      servicePriceOptionLabel: 'SUV',
    });
  });
});
