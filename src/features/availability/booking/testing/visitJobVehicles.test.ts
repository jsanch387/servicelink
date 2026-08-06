import { describe, expect, it } from 'vitest';
import {
  areVisitJobVehiclesComplete,
  firstIncompleteVisitJob,
  isJobVehicleComplete,
} from '../utils/visitJobVehicles';
import type { PublicBookingJobDraft } from '../types';

function job(
  vehicle: PublicBookingJobDraft['vehicle'],
  overrides?: Partial<PublicBookingJobDraft>
): PublicBookingJobDraft {
  return {
    localId: 'j1',
    serviceId: 's1',
    serviceName: 'Detail',
    servicePriceOptionLabel: null,
    servicePriceCents: 10000,
    selectedAddOns: [],
    durationMinutes: 60,
    vehicle,
    ...overrides,
  };
}

describe('visitJobVehicles', () => {
  it('requires year, make, and a valid 4-digit year', () => {
    expect(
      isJobVehicleComplete({ year: '2018', make: 'Toyota', model: 'Camry' })
    ).toBe(true);
    expect(
      isJobVehicleComplete({ year: '18', make: 'Toyota', model: 'Camry' })
    ).toBe(false);
    expect(
      isJobVehicleComplete({ year: '2018', make: '', model: 'Camry' })
    ).toBe(false);
  });

  it('requires every visit job to have a complete vehicle', () => {
    expect(
      areVisitJobVehiclesComplete([
        job({ year: '2018', make: 'Toyota', model: 'Camry' }),
        job({ year: '2020', make: 'Honda', model: 'Civic' }),
      ])
    ).toBe(true);
    expect(
      areVisitJobVehiclesComplete([
        job({ year: '2018', make: 'Toyota', model: 'Camry' }),
        job({ year: '', make: '', model: '' }),
      ])
    ).toBe(false);
  });

  it('returns the first incomplete job for toast copy', () => {
    const incomplete = firstIncompleteVisitJob([
      job(
        { year: '2018', make: 'Toyota', model: 'Camry' },
        { localId: 'a', serviceName: 'Shine' }
      ),
      job(
        { year: '', make: '', model: '' },
        { localId: 'b', serviceName: 'Interior' }
      ),
    ]);
    expect(incomplete?.serviceName).toBe('Interior');
  });
});
