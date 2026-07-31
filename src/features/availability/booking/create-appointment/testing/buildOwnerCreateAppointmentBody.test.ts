import { describe, expect, it } from 'vitest';
import { createEmptyVisit } from '../types';
import {
  buildOwnerCreateAppointmentBody,
  buildOwnerCreateAppointmentJobItem,
} from '../utils/buildOwnerCreateAppointmentBody';

describe('buildOwnerCreateAppointmentBody', () => {
  const job = {
    localId: 'job_1',
    isCustomJob: false,
    serviceId: 'svc-1',
    serviceName: 'Black Label Detail',
    pricingOption: { id: 'opt-1', label: 'Sedan', priceCents: 25000 },
    selectedAddOns: [
      { id: 'a1', name: 'Pet hair', priceCents: 5000, durationMinutes: 30 },
    ],
    durationMinutes: 150,
    servicePriceCents: 25000,
    vehicle: { year: '2018', make: 'Toyota', model: 'Camry' },
  };

  it('maps a catalog job with tier, add-ons, and vehicle', () => {
    const item = buildOwnerCreateAppointmentJobItem(job);
    expect(item).toMatchObject({
      serviceId: 'svc-1',
      serviceName: 'Black Label Detail',
      servicePriceOptionLabel: 'Sedan',
      servicePriceCents: 25000,
      durationMinutes: 150,
      clientJobId: 'job_1',
      vehicle: { year: '2018', make: 'Toyota', model: 'Camry' },
    });
    expect(item.selectedAddOns).toEqual([
      {
        id: 'a1',
        name: 'Pet hair',
        priceCents: 5000,
        durationMinutes: 30,
      },
    ]);
  });

  it('builds the owner multi-job POST body', () => {
    const visit = {
      ...createEmptyVisit(),
      locationType: 'mobile' as const,
      scheduledDate: '2026-07-30',
      startTime: '09:00',
      applySale: true,
      customer: {
        fullName: 'Jordan Lee',
        phone: '5551234567',
        email: 'jordan@example.com',
      },
      address: {
        street: '123 Main St',
        unit: '',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      },
      notes: 'Gate code 4421',
    };

    const body = buildOwnerCreateAppointmentBody({
      businessId: 'biz-1',
      businessSlug: 'acme',
      visit,
      jobs: [job],
    });

    expect(body.ownerManualBooking).toBe(true);
    expect(body.applySale).toBe(true);
    expect(body.serviceLocationType).toBe('mobile');
    expect(body.jobs).toHaveLength(1);
    expect(body.customer.notes).toBe('Gate code 4421');
    expect(body.customer.vehicleYear).toBe('');
  });

  it('omits serviceId and add-ons for custom jobs', () => {
    const item = buildOwnerCreateAppointmentJobItem({
      localId: 'job_c',
      isCustomJob: true,
      serviceId: null,
      serviceName: 'Interior deep clean',
      pricingOption: null,
      selectedAddOns: [],
      durationMinutes: 90,
      servicePriceCents: 15000,
      vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
    });
    expect(item.serviceId).toBeUndefined();
    expect(item.selectedAddOns).toBeUndefined();
    expect(item.servicePriceOptionLabel).toBeUndefined();
    expect(item).toMatchObject({
      serviceName: 'Interior deep clean',
      servicePriceCents: 15000,
      durationMinutes: 90,
      clientJobId: 'job_c',
      vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
    });
  });

  it('omits empty vehicles', () => {
    const item = buildOwnerCreateAppointmentJobItem({
      ...job,
      vehicle: { year: '', make: '', model: '' },
    });
    expect(item.vehicle).toBeUndefined();
  });
});
