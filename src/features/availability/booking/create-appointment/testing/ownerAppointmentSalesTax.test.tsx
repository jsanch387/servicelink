import { SelectionSummaryCard } from '@/features/availability/booking/create-appointment/components/SelectionSummaryCard';
import { ReviewStep } from '@/features/availability/booking/create-appointment/steps/ReviewStep';
import { createEmptyJobDraft } from '@/features/availability/booking/create-appointment/types';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  cleanup();
});

describe('owner appointment sales tax', () => {
  it('adds tax to the job summary while the owner is building the visit', () => {
    render(
      <SelectionSummaryCard
        draft={{
          ...createEmptyJobDraft('j1'),
          serviceName: 'Exterior Wash',
          servicePriceCents: 85_00,
        }}
        salesTaxEnabled
        salesTaxRateBps={225}
      />
    );

    expect(screen.getByText('$85')).toBeTruthy();
    expect(screen.getByText('Tax (2.25%)')).toBeTruthy();
    expect(screen.getByText('$1.91')).toBeTruthy();
    expect(screen.getByText('$86.91')).toBeTruthy();
  });

  it('adds tax once on the review total after the service price', () => {
    render(
      <ReviewStep
        jobs={[
          {
            localId: 'j1',
            isCustomJob: false,
            serviceId: 's1',
            serviceName: 'Exterior Wash',
            pricingOption: null,
            selectedAddOns: [],
            durationMinutes: 60,
            servicePriceCents: 85_00,
            vehicle: { year: '', make: '', model: '' },
          },
        ]}
        customer={{ fullName: 'Jane', phone: '', email: '' }}
        locationType="shop"
        address={{ street: '', unit: '', city: '', state: '', zip: '' }}
        scheduledDate="2026-10-27"
        startTime="09:00"
        applySale={false}
        onApplySaleChange={() => undefined}
        canAddAnotherJob={false}
        salesTaxEnabled
        salesTaxRateBps={225}
      />
    );

    expect(screen.getByText('Tax (2.25%)')).toBeTruthy();
    expect(screen.getByText('$1.91')).toBeTruthy();
    expect(screen.getByText('$86.91')).toBeTruthy();
  });

  it('leaves a membership visit untaxed', () => {
    render(
      <SelectionSummaryCard
        draft={{
          ...createEmptyJobDraft('j1'),
          serviceName: 'Membership visit',
          servicePriceCents: 0,
        }}
        membershipCovered
        salesTaxEnabled
        salesTaxRateBps={225}
      />
    );

    expect(screen.queryByText(/Tax/)).toBeNull();
    expect(screen.getAllByText('Membership').length).toBeGreaterThan(0);
  });
});
