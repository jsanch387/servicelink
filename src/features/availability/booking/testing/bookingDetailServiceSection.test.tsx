import { BookingDetailServiceSection } from '@/features/availability/booking/dashboard/BookingDetailServiceSection';
import type { AvailabilityBookingDisplay } from '@/features/availability/booking/dashboard/types';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  cleanup();
});

function baseBooking(
  override: Partial<AvailabilityBookingDisplay> = {}
): AvailabilityBookingDisplay {
  return {
    id: 'booking-1',
    customerName: 'Jane',
    customerPhone: '',
    customerEmail: '',
    serviceName: 'Full detail',
    serviceDurationMinutes: 180,
    servicePriceCents: 250_00,
    addonDetails: [],
    jobs: [],
    date: '2026-07-29',
    time: '9:00 AM',
    startTimeHHmm: '09:00',
    status: 'confirmed',
    address: { street: '', city: '', state: '', zip: '' },
    notes: '',
    createdAt: '2026-07-29T00:00:00Z',
    ...override,
  };
}

describe('BookingDetailServiceSection', () => {
  it('renders each job with price, add-on, vehicle, and visit total', () => {
    render(
      <BookingDetailServiceSection
        booking={baseBooking({
          serviceName: 'Wash + 1 more',
          servicePriceCents: 250_00,
          jobs: [
            {
              serviceName: 'Exterior wash',
              servicePriceOptionLabel: 'SUV',
              servicePriceCents: 100_00,
              durationMinutes: 45,
              selectedAddOns: [],
              vehicleLabel: '2018 Toyota Camry',
            },
            {
              serviceName: 'Interior clean',
              servicePriceOptionLabel: null,
              servicePriceCents: 150_00,
              durationMinutes: 75,
              selectedAddOns: [
                { id: 'a1', name: 'Pet hair', priceCents: 20_00 },
              ],
              vehicleLabel: '2021 Honda CR-V',
            },
          ],
        })}
      />
    );

    expect(screen.getByRole('heading', { name: /^services$/i })).toBeTruthy();
    expect(screen.getByText('Exterior wash')).toBeTruthy();
    expect(screen.getByText('SUV')).toBeTruthy();
    expect(screen.getByText(/2018 Toyota Camry/)).toBeTruthy();
    expect(screen.getByText('Interior clean')).toBeTruthy();
    expect(screen.getByText('Pet hair')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('$270.00')).toBeTruthy();
  });

  it('applies sale discount against multi-job subtotal', () => {
    render(
      <BookingDetailServiceSection
        booking={baseBooking({
          jobs: [
            {
              serviceName: 'Job A',
              servicePriceOptionLabel: null,
              servicePriceCents: 100_00,
              durationMinutes: 60,
              selectedAddOns: [],
              vehicleLabel: null,
            },
            {
              serviceName: 'Job B',
              servicePriceOptionLabel: null,
              servicePriceCents: 100_00,
              durationMinutes: 60,
              selectedAddOns: [],
              vehicleLabel: null,
            },
          ],
          discount: {
            source: 'sale',
            label: 'Summer Sale — 10% off',
            discountCents: 20_00,
            subtotalCents: 200_00,
          },
        })}
      />
    );

    expect(screen.getByText('Summer Sale — 10% off')).toBeTruthy();
    expect(screen.getByText('$180.00')).toBeTruthy();
  });
});
