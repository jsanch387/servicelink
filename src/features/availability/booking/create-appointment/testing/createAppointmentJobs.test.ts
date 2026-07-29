import { describe, expect, it } from 'vitest';
import {
  canAddAnotherJob,
  reviewJobsFromState,
  snapshotJobDraft,
  visitDurationMinutes,
} from '@/features/availability/booking/create-appointment/utils/createAppointmentJobs';
import { createEmptyJobDraft } from '@/features/availability/booking/create-appointment/types';
import { CREATE_APPOINTMENT_MAX_JOBS_MESSAGE } from '@/features/availability/booking/create-appointment/constants';

describe('createAppointmentJobs', () => {
  it('snapshots a complete catalog draft', () => {
    const draft = {
      ...createEmptyJobDraft('j1'),
      serviceId: 's1',
      serviceName: 'Wash',
      servicePriceCents: 10000,
      durationMinutes: 60,
      selectedAddOns: [
        { id: 'a1', name: 'Wax', priceCents: 2000, durationMinutes: 15 },
      ],
    };
    const snap = snapshotJobDraft(draft);
    expect(snap?.durationMinutes).toBe(75);
    expect(snap?.serviceName).toBe('Wash');
  });

  it('blocks add another at max jobs', () => {
    const draft = {
      ...createEmptyJobDraft('j1'),
      serviceId: 's1',
      serviceName: 'Wash',
      servicePriceCents: 10000,
      durationMinutes: 60,
    };
    expect(canAddAnotherJob({ committedCount: 3, draft })).toEqual({
      ok: false,
      reason: CREATE_APPOINTMENT_MAX_JOBS_MESSAGE,
    });
  });

  it('sums visit duration across committed jobs and draft', () => {
    const draft = {
      ...createEmptyJobDraft('j2'),
      serviceId: 's2',
      serviceName: 'Detail',
      servicePriceCents: 20000,
      durationMinutes: 90,
      selectedAddOns: [
        { id: 'a1', name: 'Wax', priceCents: 2000, durationMinutes: 15 },
      ],
    };
    const committed = [
      {
        localId: 'j1',
        isCustomJob: false,
        serviceId: 's1',
        serviceName: 'Wash',
        pricingOption: null,
        selectedAddOns: [],
        durationMinutes: 60,
        servicePriceCents: 10000,
        vehicle: { year: '', make: '', model: '' },
      },
    ];
    expect(visitDurationMinutes(committed, draft)).toBe(165);
    expect(reviewJobsFromState(committed, draft)).toHaveLength(2);
  });
});
