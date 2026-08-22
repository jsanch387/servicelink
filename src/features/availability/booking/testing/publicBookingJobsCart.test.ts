import {
  appendPublicBookingJob,
  clearPublicBookingJobsCart,
  loadPublicBookingJobsCart,
  publicBookingVisitServiceNameSummary,
  replacePublicBookingVisitJob,
  savePublicBookingVisitDraftOnCart,
  sumPublicBookingJobsDurationMinutes,
  sumPublicBookingJobsGrossCents,
} from '@/features/availability/booking/utils/publicBookingJobsCart';
import { INITIAL_CUSTOMER_FORM_DATA } from '@/features/availability/booking/utils/initialFormData';
import { buildPublicMultiJobBookingBody } from '@/features/availability/booking/utils/buildPublicMultiJobBookingBody';
import { PUBLIC_BOOKING_MAX_JOBS } from '@/features/availability/booking/constants/publicBookingJobs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('publicBookingJobsCart', () => {
  beforeEach(() => {
    clearPublicBookingJobsCart('acme-detail');
    vi.stubGlobal(
      'sessionStorage',
      (() => {
        const store = new Map<string, string>();
        return {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => {
            store.set(k, v);
          },
          removeItem: (k: string) => {
            store.delete(k);
          },
        };
      })()
    );
  });

  it('appends jobs and sums duration/price', () => {
    const first = appendPublicBookingJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'svc-1',
        serviceName: 'Full detail',
        servicePriceOptionLabel: 'SUV',
        servicePriceCents: 20000,
        selectedAddOns: [
          { id: 'a1', name: 'Pet hair', priceCents: 2500, durationMinutes: 15 },
        ],
        durationMinutes: 135,
        vehicle: { year: '2022', make: 'Toyota', model: 'Highlander' },
      },
    });
    expect(first.ok).toBe(true);

    const second = appendPublicBookingJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'svc-1',
        serviceName: 'Full detail',
        servicePriceOptionLabel: 'Sedan',
        servicePriceCents: 17500,
        selectedAddOns: [],
        durationMinutes: 120,
        vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
      },
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.cart.jobs).toHaveLength(2);
    expect(sumPublicBookingJobsDurationMinutes(second.cart.jobs)).toBe(255);
    expect(sumPublicBookingJobsGrossCents(second.cart.jobs)).toBe(40000);
    expect(publicBookingVisitServiceNameSummary(second.cart.jobs)).toContain(
      '+ 1 more'
    );

    const body = buildPublicMultiJobBookingBody({
      businessId: 'biz-1',
      businessSlug: 'acme-detail',
      jobs: second.cart.jobs,
      scheduledDate: '2026-08-12',
      startTime: '09:00',
      customer: {
        fullName: 'Jordan',
        email: 'j@example.com',
        phone: '5551234567',
        streetAddress: '1 Main',
        unitApt: '',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        vehicleYear: '',
        vehicleMake: '',
        vehicleModel: '',
        petName: '',
        petSpecies: '',
        petBreed: '',
        petSize: '',
        notes: '',
      },
      customerServiceLocation: 'mobile',
    });
    expect(body.jobs).toHaveLength(2);
    expect(body.serviceName).toBeUndefined();
    expect(body.jobs?.[0].vehicle?.make).toBe('Toyota');
  });

  it('replaces cart on fresh commit (clears leftovers)', () => {
    appendPublicBookingJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'old-1',
        serviceName: 'Old',
        servicePriceOptionLabel: null,
        servicePriceCents: 1000,
        selectedAddOns: [],
        durationMinutes: 30,
        vehicle: { year: '', make: '', model: '' },
      },
    });
    appendPublicBookingJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'old-2',
        serviceName: 'Old 2',
        servicePriceOptionLabel: null,
        servicePriceCents: 1000,
        selectedAddOns: [],
        durationMinutes: 30,
        vehicle: { year: '', make: '', model: '' },
      },
    });
    expect(loadPublicBookingJobsCart('acme-detail')?.jobs).toHaveLength(2);

    clearPublicBookingJobsCart('acme-detail');
    const fresh = appendPublicBookingJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'svc-new',
        serviceName: 'Signature Shine',
        servicePriceOptionLabel: 'SUV',
        servicePriceCents: 20000,
        selectedAddOns: [],
        durationMinutes: 120,
        vehicle: { year: '', make: '', model: '' },
      },
    });
    expect(fresh.ok).toBe(true);
    expect(loadPublicBookingJobsCart('acme-detail')?.jobs).toHaveLength(1);
    expect(loadPublicBookingJobsCart('acme-detail')?.jobs[0].serviceId).toBe(
      'svc-new'
    );
  });

  it('replaces the sole visit job while keeping visitDraft', () => {
    const first = appendPublicBookingJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'svc-1',
        serviceName: 'Old detail',
        servicePriceOptionLabel: null,
        servicePriceCents: 10000,
        selectedAddOns: [],
        durationMinutes: 60,
        vehicle: { year: '2018', make: 'Toyota', model: 'Camry' },
      },
    });
    expect(first.ok).toBe(true);
    savePublicBookingVisitDraftOnCart('acme-detail', {
      customerData: {
        ...INITIAL_CUSTOMER_FORM_DATA,
        fullName: 'Jordan',
        phone: '5551234567',
      },
      selectedDateIso: '2026-08-12T12:00:00.000Z',
      selectedDateYmd: '2026-08-12',
      selectedTime: '09:00',
      step: 'details',
      detailsSubStep: 'vehicleNotes',
      customerServiceChoice: 'mobile',
      agreedToNotifications: true,
    });

    const replaced = replacePublicBookingVisitJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'svc-2',
        serviceName: 'New shine',
        servicePriceOptionLabel: 'SUV',
        servicePriceCents: 20000,
        selectedAddOns: [],
        durationMinutes: 90,
        vehicle: { year: '2018', make: 'Toyota', model: 'Camry' },
      },
    });
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) return;
    expect(replaced.cart.jobs).toHaveLength(1);
    expect(replaced.cart.jobs[0].serviceName).toBe('New shine');
    expect(replaced.cart.visitDraft?.customerData.fullName).toBe('Jordan');
    expect(replaced.cart.visitDraft?.selectedTime).toBe('09:00');
  });

  it('enforces max jobs', () => {
    for (let i = 0; i < PUBLIC_BOOKING_MAX_JOBS; i++) {
      const r = appendPublicBookingJob({
        businessSlug: 'acme-detail',
        job: {
          serviceId: `svc-${i}`,
          serviceName: `Service ${i}`,
          servicePriceOptionLabel: null,
          servicePriceCents: 1000,
          selectedAddOns: [],
          durationMinutes: 30,
          vehicle: { year: '', make: '', model: '' },
        },
      });
      expect(r.ok).toBe(true);
    }
    const over = appendPublicBookingJob({
      businessSlug: 'acme-detail',
      job: {
        serviceId: 'svc-x',
        serviceName: 'Extra',
        servicePriceOptionLabel: null,
        servicePriceCents: 1000,
        selectedAddOns: [],
        durationMinutes: 30,
        vehicle: { year: '', make: '', model: '' },
      },
    });
    expect(over.ok).toBe(false);
    if (over.ok) return;
    expect(over.reason).toBe('max_jobs');
    expect(loadPublicBookingJobsCart('acme-detail')?.jobs).toHaveLength(
      PUBLIC_BOOKING_MAX_JOBS
    );
  });
});
