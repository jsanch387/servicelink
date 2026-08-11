import {
  addMinutesToStartTimeSameDay,
  appointmentFitsSameDay,
  appointmentServiceNameSummary,
  normalizeStartTimeHHmm,
  parseOwnerManualBookingJobs,
  sumJobDurationMinutes,
  toBookingJobDetails,
} from '@/features/availability/booking/utils/ownerManualBookingJobs';
import { describe, expect, it } from 'vitest';

describe('parseOwnerManualBookingJobs', () => {
  it('accepts catalog + custom mix', () => {
    const result = parseOwnerManualBookingJobs([
      {
        serviceId: 'svc-1',
        serviceName: 'Full detail',
        servicePriceOptionLabel: 'SUV',
        servicePriceCents: 22500,
        selectedAddOns: [
          { id: 'a1', name: 'Pet hair', priceCents: 2500, durationMinutes: 15 },
        ],
        durationMinutes: 135,
        vehicle: { year: '2022', make: 'Toyota', model: 'Highlander' },
      },
      {
        serviceName: 'Touch-up paint',
        servicePriceCents: 7500,
        durationMinutes: 45,
        vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0].serviceId).toBe('svc-1');
    expect(result.jobs[1].serviceId).toBeNull();
    expect(sumJobDurationMinutes(result.jobs)).toBe(180);
    expect(toBookingJobDetails(result.jobs)).toHaveLength(2);
    expect(appointmentServiceNameSummary(result.jobs)).toContain('+ 1 more');
  });

  it('rejects custom jobs with add-ons', () => {
    const result = parseOwnerManualBookingJobs([
      {
        serviceName: 'Custom',
        servicePriceCents: 1000,
        durationMinutes: 30,
        selectedAddOns: [{ id: 'a', name: 'X', priceCents: 100 }],
      },
    ]);
    expect(result.ok).toBe(false);
  });

  it('rejects empty jobs array', () => {
    const result = parseOwnerManualBookingJobs([]);
    expect(result.ok).toBe(false);
  });

  it('rejects partial vehicle', () => {
    const result = parseOwnerManualBookingJobs([
      {
        serviceName: 'Wash',
        servicePriceCents: 5000,
        durationMinutes: 60,
        vehicle: { year: '2020', make: '', model: '' },
      },
    ]);
    expect(result.ok).toBe(false);
  });

  it('keeps digits in vehicle model (e.g. Ram 2500)', () => {
    const result = parseOwnerManualBookingJobs([
      {
        serviceName: 'Wash',
        servicePriceCents: 5000,
        durationMinutes: 60,
        vehicle: { year: '2015', make: 'Ram', model: '2500' },
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.jobs[0].vehicle).toEqual({
      year: '2015',
      make: 'Ram',
      model: '2500',
    });
  });
});

describe('appointment schedule helpers', () => {
  it('sums duration for one appointment block', () => {
    expect(appointmentFitsSameDay('09:00', 180)).toBe(true);
    expect(appointmentFitsSameDay('23:00', 120)).toBe(false);
    expect(appointmentFitsSameDay('22:00', 120)).toBe(true);
  });

  it('normalizes start time', () => {
    expect(normalizeStartTimeHHmm('9:05')).toBe('09:05');
    expect(addMinutesToStartTimeSameDay('9:05', 0)).toBe('09:05');
  });
});
