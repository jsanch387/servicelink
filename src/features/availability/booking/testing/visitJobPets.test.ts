import { describe, expect, it } from 'vitest';
import type { PublicBookingJobDraft } from '../types';
import {
  areVisitJobPetsComplete,
  firstIncompleteVisitPetJob,
  isJobPetComplete,
} from '../utils/visitJobPets';

function job(
  pet: PublicBookingJobDraft['pet'],
  overrides?: Partial<PublicBookingJobDraft>
): PublicBookingJobDraft {
  return {
    localId: 'job-1',
    serviceId: 'svc-1',
    serviceName: 'Full Groom',
    servicePriceOptionLabel: null,
    servicePriceCents: 7500,
    selectedAddOns: [],
    durationMinutes: 60,
    vehicle: { year: '', make: '', model: '' },
    pet,
    ...overrides,
  };
}

describe('visitJobPets', () => {
  it('requires name, species, breed, and size', () => {
    expect(
      isJobPetComplete({
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        size: 'Medium',
      })
    ).toBe(true);
    expect(
      isJobPetComplete({
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        size: '',
      })
    ).toBe(false);
    expect(
      isJobPetComplete({
        name: 'Buddy',
        species: 'Hamster',
        breed: 'Syrian',
        size: 'Small',
      })
    ).toBe(false);
  });

  it('finds the first incomplete visit pet', () => {
    const jobs = [
      job({
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        size: 'Medium',
      }),
      job(
        { name: 'Milo', species: 'Cat', breed: '', size: 'Small' },
        { localId: 'job-2', serviceName: 'Cat Bath' }
      ),
    ];
    expect(areVisitJobPetsComplete(jobs)).toBe(false);
    expect(firstIncompleteVisitPetJob(jobs)?.serviceName).toBe('Cat Bath');
  });
});
